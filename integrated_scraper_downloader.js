// INTEGRATED MEDIA SCRAPER AND DOWNLOADER
// Combines enhanced scraping with automatic media download + GCS upload
// For academic research - collects and downloads ALL media content

import * as fs from 'node:fs';
import * as path from 'node:path';
import { Storage } from '@google-cloud/storage';
import { Buffer } from 'node:buffer';
import { scrapeUserMediaCompleteFixed } from './fixed_scraper.js';

// 🎯 CONFIGURATION
const DOWNLOAD_CONFIG = {
    maxPages: 50,              // How many pages to scrape
    downloadVideos: true,      // Download video files
    downloadImages: false,     // Skip image files - VIDEOS ONLY
    concurrentDownloads: 3,    // Parallel downloads (increased since no images)
    userId: "970834227221618688", // _tee_forever
    username: "_tee_forever"      // For folder naming
};

// ☁️ GOOGLE CLOUD STORAGE CONFIGURATION
const GCS_CONFIG = {
    bucketName: 'twitter-scrape122',     // 🔧 CHANGE THIS TO YOUR BUCKET NAME
    enableUpload: true,                  // Set to false to disable GCS uploads
    folderPrefix: 'twitter-videos'       // Folder structure: twitter-videos/username/
};

// Initialize GCS client
let gcsStorage = null;
let gcsBucket = null;

if (GCS_CONFIG.enableUpload) {
    try {
        const gcsOptions = {};
        
        // Try to use application default credentials
        const adcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || 
                       `${process.env.HOME}/.config/gcloud/application_default_credentials.json`;
        
        if (fs.existsSync(adcPath)) {
            console.log(`📋 Using ADC file: ${adcPath}`);
            gcsOptions.keyFilename = adcPath;
        } else {
            console.log(`⚠️  No ADC file found, using default authentication`);
        }
        
        gcsStorage = new Storage(gcsOptions);
        gcsBucket = gcsStorage.bucket(GCS_CONFIG.bucketName);
        console.log(`☁️  GCS initialized for bucket: ${GCS_CONFIG.bucketName}`);
        
    } catch (error) {
        console.error(`❌ Failed to initialize GCS: ${error.message}`);
        console.log(`⚠️  Continuing with local storage only...`);
        gcsStorage = null;
        gcsBucket = null;
    }
}

// ☁️ Upload file to Google Cloud Storage
async function uploadToGCS(localFilePath, username, filename) {
    if (!GCS_CONFIG.enableUpload || !gcsBucket) {
        return { success: false, reason: 'GCS not enabled or initialized' };
    }

    try {
        const gcsPath = `${GCS_CONFIG.folderPrefix}/${username}/${filename}`;
        const file = gcsBucket.file(gcsPath);
        
        // Check if file already exists in GCS
        const [exists] = await file.exists();
        if (exists) {
            return { success: true, reason: 'already exists', gcsPath };
        }

        // Read file and upload
        const fileBuffer = fs.readFileSync(localFilePath);
        
        await file.save(fileBuffer, {
            metadata: {
                contentType: 'video/mp4',
                metadata: {
                    username: username,
                    uploadedAt: new Date().toISOString(),
                    source: 'integrated-twitter-scraper'
                }
            },
            timeout: 60000,
            resumable: true
        });

        return { success: true, reason: 'uploaded', gcsPath };
    } catch (error) {
        let errorMessage = error.message;
        
        if (error.code === 403) {
            errorMessage = `Permission denied. Run: gcloud auth application-default login`;
        } else if (error.code === 401) {
            errorMessage = `Authentication failed. Run: gcloud auth login`;
        } else if (error.code === 404) {
            errorMessage = `Bucket not found. Create with: gsutil mb gs://${GCS_CONFIG.bucketName}`;
        }
        
        return { success: false, reason: errorMessage };
    }
}

// Global statistics
let downloadStats = {
    totalMedia: 0,
    totalVideos: 0,
    totalImages: 0,
    downloadedVideos: 0,
    downloadedImages: 0,
    failedDownloads: 0,
    skippedDownloads: 0,
    totalSizeMB: 0,
    gcsUploaded: 0,
    gcsFailed: 0
};

// 🎬 Extract ALL media URLs from scraped data
function extractAllMediaUrls(scrapedData) {
    const mediaUrls = [];
    let mediaCount = 0;

    function processPage(page) {
        const instructions = page?.data?.user?.result?.timeline?.timeline?.instructions || [];
        
        for (const instruction of instructions) {
            if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
                for (const entry of instruction.entries) {
                    // Handle TimelineTimelineModule structure
                    if (entry.content?.entryType === 'TimelineTimelineModule' && entry.content.items) {
                        for (const item of entry.content.items) {
                            const urls = extractMediaFromTweet(item.item?.itemContent?.tweet_results?.result);
                            mediaUrls.push(...urls);
                        }
                    }
                    // Handle direct tweet entries
                    else if (entry.entryId?.startsWith('tweet-')) {
                        const urls = extractMediaFromTweet(entry.content?.itemContent?.tweet_results?.result);
                        mediaUrls.push(...urls);
                    }
                }
            }
            
            // Handle TimelineAddToModule
            if (instruction.type === 'TimelineAddToModule' && instruction.moduleItems) {
                for (const moduleItem of instruction.moduleItems) {
                    const urls = extractMediaFromTweet(moduleItem.item?.itemContent?.tweet_results?.result);
                    mediaUrls.push(...urls);
                }
            }
        }
    }

    // Process all pages
    scrapedData.pages.forEach(processPage);

    return mediaUrls;
}

// Extract media URLs from a single tweet
function extractMediaFromTweet(tweetResult) {
    const mediaUrls = [];
    
    if (!tweetResult) return mediaUrls;
    
    // Handle TweetWithVisibilityResults wrapper
    const tweet = tweetResult.__typename === 'TweetWithVisibilityResults' ? tweetResult.tweet : tweetResult;
    if (!tweet) return mediaUrls;

    // Get tweet ID for naming
    const tweetId = tweet.rest_id || tweet.legacy?.id_str || 'unknown';
    
    // Check multiple possible media locations
    const possibleMediaPaths = [
        tweet.legacy?.extended_entities?.media,
        tweet.legacy?.entities?.media,
        tweet.extended_entities?.media,
        tweet.entities?.media
    ];
    
    let mediaIndex = 0;
    
    for (const mediaArray of possibleMediaPaths) {
        if (mediaArray && Array.isArray(mediaArray)) {
            mediaArray.forEach(media => {
                mediaIndex++;
                
                // Handle videos
                if (media.type === 'video' || media.type === 'animated_gif') {
                    if (media.video_info && media.video_info.variants) {
                        // Get highest quality MP4 variant
                        const mp4Variants = media.video_info.variants
                            .filter(v => v.content_type === 'video/mp4')
                            .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
                        
                        if (mp4Variants.length > 0) {
                            const bestVariant = mp4Variants[0];
                            const quality = bestVariant.bitrate >= 5000000 ? '1080p' : 
                                           bestVariant.bitrate >= 2000000 ? '720p' : 
                                           bestVariant.bitrate >= 900000 ? '480p' : '320p';
                            
                            mediaUrls.push({
                                type: 'video',
                                url: bestVariant.url,
                                quality: quality,
                                bitrate: bestVariant.bitrate || 0,
                                filename: `video_${tweetId}_${mediaIndex}_${quality}.mp4`,
                                tweetId: tweetId,
                                mediaId: media.id_str
                            });
                        }
                    }
                }
                
                // Handle images
                else if (media.type === 'photo') {
                    // Get highest resolution image URL
                    const imageUrl = media.media_url_https || media.media_url;
                    if (imageUrl) {
                        // Twitter image URLs can be modified for different sizes
                        // Use :orig for original quality
                        const highQualityUrl = imageUrl.includes('?') ? 
                            imageUrl.split('?')[0] + ':orig' : 
                            imageUrl + ':orig';
                        
                        const extension = imageUrl.includes('.jpg') ? 'jpg' : 
                                         imageUrl.includes('.png') ? 'png' : 
                                         imageUrl.includes('.gif') ? 'gif' : 'jpg';
                        
                        mediaUrls.push({
                            type: 'image',
                            url: highQualityUrl,
                            quality: 'original',
                            filename: `image_${tweetId}_${mediaIndex}.${extension}`,
                            tweetId: tweetId,
                            mediaId: media.id_str
                        });
                    }
                }
            });
        }
    }
    
    return mediaUrls;
}

// 📥 Download a single media file
async function downloadMediaFile(mediaItem, index, total) {
    const downloadDir = path.join('downloads', DOWNLOAD_CONFIG.username);
    
    // Create download directory if it doesn't exist
    if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    const outputPath = path.join(downloadDir, mediaItem.filename);
    
    // Check if file already exists
    if (fs.existsSync(outputPath)) {
        console.log(`   ⏭️  [${index + 1}/${total}] Skipped (exists): ${mediaItem.filename}`);
        downloadStats.skippedDownloads++;
        return { success: true, skipped: true };
    }
    
    try {
        console.log(`   ⬇️  [${index + 1}/${total}] Downloading: ${mediaItem.filename}`);
        
        const response = await fetch(mediaItem.url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://twitter.com/'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentLength = response.headers.get('content-length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
        
        let downloadedBytes = 0;
        const chunks = [];
        const reader = response.body.getReader();
        const startTime = Date.now();
        
        // Download with progress tracking
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            chunks.push(value);
            downloadedBytes += value.length;
            
            // Show progress for larger files
            if (totalBytes > 1024 * 1024) { // > 1MB
                const progress = totalBytes > 0 ? (downloadedBytes / totalBytes * 100).toFixed(1) : '?';
                const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(1);
                const speed = downloadedBytes / ((Date.now() - startTime) / 1000) / 1024; // KB/s
                
                process.stdout.write(`\r   📊 [${index + 1}/${total}] ${progress}% (${downloadedMB}MB) ${speed.toFixed(0)}KB/s`);
            }
        }
        
        // Combine chunks and save
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const finalBuffer = new Uint8Array(totalLength);
        let position = 0;
        for (const chunk of chunks) {
            finalBuffer.set(chunk, position);
            position += chunk.length;
        }
        
        fs.writeFileSync(outputPath, Buffer.from(finalBuffer));
        
        const fileSizeMB = (finalBuffer.length / 1024 / 1024);
        const downloadDuration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        // Clear progress line and show success
        if (totalBytes > 1024 * 1024) {
            process.stdout.write('\r' + ' '.repeat(80) + '\r');
        }
        
        console.log(`   ✅ [${index + 1}/${total}] Downloaded: ${mediaItem.filename} (${fileSizeMB.toFixed(2)}MB in ${downloadDuration}s)`);
        console.log(`   📁 Local path: ${outputPath}`);
        
        // Upload to GCS
        let gcsResult = { success: false, reason: 'disabled' };
        if (GCS_CONFIG.enableUpload) {
            console.log(`   ☁️  [${index + 1}/${total}] Uploading to GCS...`);
            const uploadStartTime = Date.now();
            gcsResult = await uploadToGCS(outputPath, DOWNLOAD_CONFIG.username, mediaItem.filename);
            const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(1);
            
            if (gcsResult.success) {
                if (gcsResult.reason === 'uploaded') {
                    console.log(`   ☁️  [${index + 1}/${total}] ✅ Uploaded to GCS (${uploadDuration}s)`);
                    console.log(`   🗂️  GCS path: gs://${GCS_CONFIG.bucketName}/${gcsResult.gcsPath}`);
                    downloadStats.gcsUploaded++;
                } else {
                    console.log(`   ☁️  [${index + 1}/${total}] ⏭️  Already exists in GCS`);
                    console.log(`   🗂️  GCS path: gs://${GCS_CONFIG.bucketName}/${gcsResult.gcsPath}`);
                    downloadStats.gcsUploaded++;
                }
            } else {
                console.log(`   ☁️  [${index + 1}/${total}] ❌ GCS upload failed: ${gcsResult.reason}`);
                downloadStats.gcsFailed++;
            }
        } else {
            console.log(`   ☁️  GCS upload: Disabled`);
        }
        
        // Update stats
        downloadStats.totalSizeMB += fileSizeMB;
        if (mediaItem.type === 'video') {
            downloadStats.downloadedVideos++;
        } else {
            downloadStats.downloadedImages++;
        }
        
        return { 
            success: true, 
            size: fileSizeMB,
            gcsUploaded: gcsResult.success,
            gcsPath: gcsResult.gcsPath || null
        };
        
    } catch (error) {
        console.error(`   ❌ [${index + 1}/${total}] Failed: ${mediaItem.filename} - ${error.message}`);
        downloadStats.failedDownloads++;
        return { success: false, error: error.message };
    }
}

// 📥 Download all media files with controlled concurrency
async function downloadAllMedia(mediaUrls) {
    console.log(`\n📥 Starting downloads...`);
    console.log(`🎯 ${mediaUrls.length} media files to download`);
    
    if (mediaUrls.length === 0) {
        console.log('ℹ️  No media files to download');
        return;
    }
    
    // Filter by type based on config
    const filteredUrls = mediaUrls.filter(media => {
        if (media.type === 'video' && !DOWNLOAD_CONFIG.downloadVideos) return false;
        if (media.type === 'image' && !DOWNLOAD_CONFIG.downloadImages) return false;
        return true;
    });
    
    console.log(`📋 After filtering: ${filteredUrls.length} files (Videos: ${DOWNLOAD_CONFIG.downloadVideos ? 'ON' : 'OFF'}, Images: ${DOWNLOAD_CONFIG.downloadImages ? 'ON' : 'OFF'})`);
    
    // Process downloads with controlled concurrency
    const { concurrentDownloads } = DOWNLOAD_CONFIG;
    const results = [];
    
    for (let i = 0; i < filteredUrls.length; i += concurrentDownloads) {
        const batch = filteredUrls.slice(i, i + concurrentDownloads);
        
        const batchPromises = batch.map(async (mediaItem, batchIndex) => {
            return await downloadMediaFile(mediaItem, i + batchIndex, filteredUrls.length);
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
            if (result.status === 'fulfilled') {
                results.push(result.value);
            } else {
                results.push({ success: false, error: 'Promise rejected' });
                downloadStats.failedDownloads++;
            }
        });
        
        // Small delay between batches
        if (i + concurrentDownloads < filteredUrls.length) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    return results;
}

// 🚀 Main integration function
async function scrapeAndDownloadMedia() {
    console.log('🎓 INTEGRATED MEDIA SCRAPER AND DOWNLOADER');
    console.log('=' .repeat(60));
    console.log(`👤 User: ${DOWNLOAD_CONFIG.username} (${DOWNLOAD_CONFIG.userId})`);
    console.log(`📄 Max pages: ${DOWNLOAD_CONFIG.maxPages}`);
    console.log(`🎬 Download videos: ${DOWNLOAD_CONFIG.downloadVideos}`);
    console.log(`🖼️  Download images: ${DOWNLOAD_CONFIG.downloadImages}`);
    console.log(`⚡ Concurrent downloads: ${DOWNLOAD_CONFIG.concurrentDownloads}`);
    console.log(`\n📁 STORAGE CONFIGURATION:`);
    console.log(`   Local folder: ${path.resolve('downloads', DOWNLOAD_CONFIG.username)}`);
    if (GCS_CONFIG.enableUpload) {
        console.log(`   ☁️  GCS enabled: YES`);
        console.log(`   🗂️  GCS bucket: gs://${GCS_CONFIG.bucketName}/${GCS_CONFIG.folderPrefix}/${DOWNLOAD_CONFIG.username}/`);
    } else {
        console.log(`   ☁️  GCS enabled: NO (local storage only)`);
    }
    console.log('=' .repeat(60));
    
    const overallStartTime = Date.now();
    
    try {
        // Step 1: Scrape all media data
        console.log('\n🕷️  STEP 1: SCRAPING MEDIA DATA');
        console.log('-' .repeat(40));
        
        const scrapedData = await scrapeUserMediaCompleteFixed(
            DOWNLOAD_CONFIG.userId, 
            DOWNLOAD_CONFIG.maxPages
        );
        
        console.log(`✅ Scraping complete!`);
        console.log(`   📊 Found: ${scrapedData.stats.totalTweets} tweets, ${scrapedData.stats.totalMedia} media items`);
        
        // Step 2: Extract media URLs
        console.log('\n🔗 STEP 2: EXTRACTING MEDIA URLS');
        console.log('-' .repeat(40));
        
        const mediaUrls = extractAllMediaUrls(scrapedData);
        
        // Categorize media
        const videos = mediaUrls.filter(m => m.type === 'video');
        const images = mediaUrls.filter(m => m.type === 'image');
        
        downloadStats.totalMedia = mediaUrls.length;
        downloadStats.totalVideos = videos.length;
        downloadStats.totalImages = images.length;
        
        console.log(`✅ URL extraction complete!`);
        console.log(`   🎬 Videos: ${videos.length}`);
        console.log(`   🖼️  Images: ${images.length}`);
        console.log(`   📋 Total URLs: ${mediaUrls.length}`);
        
        // Show sample URLs
        if (mediaUrls.length > 0) {
            console.log('\n📝 Sample media found:');
            mediaUrls.slice(0, 5).forEach((media, i) => {
                console.log(`   ${i + 1}. ${media.type}: ${media.filename} (${media.quality})`);
            });
            if (mediaUrls.length > 5) {
                console.log(`   ... and ${mediaUrls.length - 5} more`);
            }
        }
        
        // Step 3: Download media
        console.log('\n📥 STEP 3: DOWNLOADING MEDIA FILES');
        console.log('-' .repeat(40));
        
        if (mediaUrls.length === 0) {
            console.log('ℹ️  No media files found to download');
        } else {
            await downloadAllMedia(mediaUrls);
        }
        
        // Step 4: Final summary
        const totalTime = ((Date.now() - overallStartTime) / 1000 / 60).toFixed(1);
        
        console.log('\n🎉 DOWNLOAD COMPLETE - FINAL SUMMARY');
        console.log('=' .repeat(60));
        console.log(`👤 User: ${DOWNLOAD_CONFIG.username}`);
        console.log(`📄 Pages scraped: ${scrapedData.stats.totalPages}`);
        console.log(`🐦 Tweets analyzed: ${scrapedData.stats.totalTweets}`);
        console.log(`📊 Media items found: ${downloadStats.totalMedia}`);
        console.log(`   🎬 Videos: ${downloadStats.totalVideos} (downloaded: ${downloadStats.downloadedVideos})`);
        console.log(`   🖼️  Images: ${downloadStats.totalImages} (downloaded: ${downloadStats.downloadedImages})`);
        console.log(`✅ Successfully downloaded: ${downloadStats.downloadedVideos + downloadStats.downloadedImages}`);
        console.log(`❌ Failed downloads: ${downloadStats.failedDownloads}`);
        console.log(`⏭️  Skipped (existing): ${downloadStats.skippedDownloads}`);
        console.log(`📦 Total size downloaded: ${downloadStats.totalSizeMB.toFixed(2)} MB`);
        console.log(`⏱️  Total time: ${totalTime} minutes`);
        console.log(`\n📁 STORAGE LOCATIONS:`);
        console.log(`   Local directory: ${path.resolve('downloads', DOWNLOAD_CONFIG.username)}`);
        if (GCS_CONFIG.enableUpload) {
            console.log(`   ☁️  GCS uploads successful: ${downloadStats.gcsUploaded}`);
            console.log(`   ☁️  GCS upload failures: ${downloadStats.gcsFailed}`);
            console.log(`   🗂️  GCS bucket path: gs://${GCS_CONFIG.bucketName}/${GCS_CONFIG.folderPrefix}/${DOWNLOAD_CONFIG.username}/`);
            console.log(`   🌐 GCS web console: https://console.cloud.google.com/storage/browser/${GCS_CONFIG.bucketName}/${GCS_CONFIG.folderPrefix}/${DOWNLOAD_CONFIG.username}`);
        } else {
            console.log(`   ☁️  GCS uploads: Disabled`);
        }
        console.log(`⏱️  Total time: ${totalTime} minutes`);
        console.log(`📁 Download location: ./downloads/${DOWNLOAD_CONFIG.username}/`);
        
        // Academic research summary
        console.log('\n🎓 ACADEMIC RESEARCH VALUE:');
        console.log('   ✅ Comprehensive data collection across multiple pages');
        console.log('   ✅ Both quantitative metrics AND actual media files');
        console.log('   ✅ Structured data for statistical analysis');
        console.log('   ✅ Media content for qualitative research');
        console.log('   ✅ Temporal distribution analysis (page-by-page)');
        
        console.log('\n🎯 SUCCESS! Your university project now has:');
        console.log(`   - ${scrapedData.stats.totalTweets} posts analyzed`);
        console.log(`   - ${downloadStats.downloadedVideos + downloadStats.downloadedImages} media files downloaded`);
        console.log(`   - Complete dataset for academic analysis`);
        
        return {
            scrapingStats: scrapedData.stats,
            downloadStats: downloadStats,
            mediaUrls: mediaUrls
        };
        
    } catch (error) {
        console.error('\n❌ Process failed:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    }
}

// Export for use in other modules
export { 
    scrapeAndDownloadMedia, 
    extractAllMediaUrls, 
    downloadAllMedia,
    DOWNLOAD_CONFIG,
    GCS_CONFIG 
};

// Run if executed directly

scrapeAndDownloadMedia().catch(error => {
    console.error('\n💥 Application failed:', error);
    process.exit(1);
});
