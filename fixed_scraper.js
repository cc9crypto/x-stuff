// FIXED Enhanced Twitter Scraper with Working Pagination
// This version ensures subsequent pages also return media content

export async function request_yoshi_fixed(cursor = null) {
    const variables = {
        "userId": "970834227221618688", // yoshi9467
        "count": 40, // Increased count to get more items per page
        "includePromotedContent": false,
        "withClientEventToken": false,
        "withBirdwatchNotes": false,
        "withVoice": true
    };

    // Add cursor if provided
    if (cursor) {
        variables.cursor = cursor;
    }

    const features = {
        "rweb_video_screen_enabled": false,
        "payments_enabled": false,
        "profile_label_improvements_pcf_label_in_post_enabled": true,
        "rweb_tipjar_consumption_enabled": true,
        "verified_phone_label_enabled": false,
        "creator_subscriptions_tweet_preview_api_enabled": true,
        "responsive_web_graphql_timeline_navigation_enabled": true,
        "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
        "premium_content_api_read_enabled": false,
        "communities_web_enable_tweet_community_results_fetch": true,
        "c9s_tweet_anatomy_moderator_badge_enabled": true,
        "responsive_web_grok_analyze_button_fetch_trends_enabled": false,
        "responsive_web_grok_analyze_post_followups_enabled": true,
        "responsive_web_jetfuel_frame": false,
        "responsive_web_grok_share_attachment_enabled": true,
        "articles_preview_enabled": true,
        "responsive_web_edit_tweet_api_enabled": true,
        "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
        "view_counts_everywhere_api_enabled": true,
        "longform_notetweets_consumption_enabled": true,
        "responsive_web_twitter_article_tweet_consumption_enabled": true,
        "tweet_awards_web_tipping_enabled": false,
        "responsive_web_grok_show_grok_translated_post": false,
        "responsive_web_grok_analysis_button_from_backend": true,
        "creator_subscriptions_quote_tweet_preview_enabled": false,
        "freedom_of_speech_not_reach_fetch_enabled": true,
        "standardized_nudges_misinfo": true,
        "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
        "longform_notetweets_rich_text_read_enabled": true,
        "longform_notetweets_inline_media_enabled": true,
        "responsive_web_grok_image_annotation_enabled": true,
        "responsive_web_enhance_cards_enabled": false
    };

    const fieldToggles = {
        "withArticlePlainText": false
    };

    // Encode parameters
    const variablesStr = encodeURIComponent(JSON.stringify(variables));
    const featuresStr = encodeURIComponent(JSON.stringify(features));
    const fieldTogglesStr = encodeURIComponent(JSON.stringify(fieldToggles));

    const url = `https://x.com/i/api/graphql/lab_lGirtVopc4lgPFX73w/UserMedia?variables=${variablesStr}&features=${featuresStr}&fieldToggles=${fieldTogglesStr}`;

    console.log(`🌐 Making request ${cursor ? 'with cursor: ' + cursor.substring(0, 20) + '...' : '(initial)'}`);

    const response = await fetch(url, {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.7",
            "authorization": "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
            "content-type": "application/json",
            "priority": "u=1, i",
            "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Brave\";v=\"138\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "sec-gpc": "1",
            "x-client-transaction-id": generateTransactionId(),
            "x-csrf-token": "16ff6dc9285ea9c1f4b1e458c0cffc802f5ff2f208b7d42f932770f71bb62b83d8f133ed0dc9fb7bdf44c540d85818e0c29e6f85996bb260849065533a2e5a013b22b9f0fa4dcc75cd29f9631df3f75a",
            "x-twitter-active-user": "yes",
            "x-twitter-auth-type": "OAuth2Session",
            "x-twitter-client-language": "en",
            "x-xp-forwarded-for": "1cb0d542a1d9784bbc102fcf796f0dd4e7b358c39d40ad5216b795a6067c52fdf8dcdce2be61dd9f963b980f0761ff89a1baf78c9e7e0c8490b4ac7b11cfb518b20ba877dd5fc3068c947ac15eafedb87a2f764f9230b2e3df79f1c04afd370a859f6c82a7d91900422dcb73c02373c12a64fc20f159fd477f54b57bbc885e140592174d8b6446f64ae63e54ecbdaa651d000b222d95846797788dbbef398f16db0e0605a8b35a57d1821d1b55b59853ce7ec0f2130f548e1b7dae756793469c857f7ac55fd82900fccb0d8069414e122e046bc961e7065874728bb2cc797ba5adc6b8afc9034d44d0edbf4aafbf038258f33dccd3b86b6b1b9bcb",
            "cookie": "guest_id=v1%3A174330296444110671; kdt=CgIjpe4x3Qsggt31osrTJvKG77vnxGa9nBNfQumY; auth_token=3c2c0df43177def9d1634b2f797446ba8e3d80da; ct0=16ff6dc9285ea9c1f4b1e458c0cffc802f5ff2f208b7d42f932770f71bb62b83d8f133ed0dc9fb7bdf44c540d85818e0c29e6f85996bb260849065533a2e5a013b22b9f0fa4dcc75cd29f9631df3f75a; twid=u%3D1070023533856739328; d_prefs=MjoxLGNvbnNlbnRfdmVyc2lvbjoyLHRleHRfdmVyc2lvbjoxMDAw; lang=en; guest_id_marketing=v1%3A174330296444110671; guest_id_ads=v1%3A174330296444110671; personalization_id=\"v1_jha8HpUmGfZI/zsn53TYkQ==\"; __cf_bm=copbmwCZJa2v_uAqYsSkOa4oQauFKlQRfSrV3_bYsC4-1751371709-1.0.1.1-B1vGzzUpBlKlvBsVcKDjPpULGJCLOdn1gwsRTjDvFklmoETItxoNdvBnpSd7wrXtPTp0U7Ep.9mzb.HiAZmWuCArtZi7q5mk.5zWARcnVxo; external_referer=padhuUp37zgeCAGMzhY%2BsFHe2aGXYBFz|0|S38otfNfzYt86Dak8Eqj76tqscUAnK6Lq4vYdCl5zxIvK6QAA8vRkA%3D%3D",
            "Referer": "https://x.com/yoshi9467/media?s=21&t=25uzmpJu4ex2oMLljd-sWA"
        },
        "body": null,
        "method": "GET"
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const body = await response.json();
    
    // Enhanced media counting that covers ALL possible structures
    const mediaCount = countMediaItemsComplete(body);
    console.log(`📊 Found ${mediaCount} media items in this page`);
    
    return body;
}

// FIXED: Complete media counting function that finds media in all structures
function countMediaItemsComplete(response) {
    let count = 0;
    
    try {
        const instructions = response?.data?.user?.result?.timeline?.timeline?.instructions || [];
        
        for (const instruction of instructions) {
            // Handle TimelineAddEntries
            if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
                for (const entry of instruction.entries) {
                    // Handle TimelineTimelineModule structure (grid layout)
                    if (entry.content?.entryType === 'TimelineTimelineModule' && entry.content.items) {
                        for (const item of entry.content.items) {
                            const media = extractMediaFromTweet(item.item?.itemContent?.tweet_results?.result);
                            count += media;
                        }
                    }
                    // Handle direct tweet entries
                    else if (entry.entryId?.startsWith('tweet-') || entry.entryId?.startsWith('profile-grid-')) {
                        const media = extractMediaFromTweet(entry.content?.itemContent?.tweet_results?.result);
                        count += media;
                    }
                }
            }
            
            // Handle TimelineAddToModule (alternative structure)
            if (instruction.type === 'TimelineAddToModule' && instruction.moduleItems) {
                for (const moduleItem of instruction.moduleItems) {
                    const media = extractMediaFromTweet(moduleItem.item?.itemContent?.tweet_results?.result);
                    count += media;
                }
            }
        }
        
    } catch (error) {
        console.log(`⚠️ Error counting media: ${error.message}`);
    }
    
    return count;
}

// Extract media from tweet result, handling all possible structures
function extractMediaFromTweet(tweetResult) {
    if (!tweetResult) return 0;
    
    // Handle TweetWithVisibilityResults wrapper
    const tweet = tweetResult.__typename === 'TweetWithVisibilityResults' ? tweetResult.tweet : tweetResult;
    
    if (!tweet) return 0;
    
    // Check multiple possible media locations
    const possibleMediaPaths = [
        tweet.legacy?.extended_entities?.media,
        tweet.legacy?.entities?.media,
        tweet.extended_entities?.media,
        tweet.entities?.media
    ];
    
    for (const mediaArray of possibleMediaPaths) {
        if (mediaArray && Array.isArray(mediaArray) && mediaArray.length > 0) {
            return mediaArray.length;
        }
    }
    
    return 0;
}

// FIXED: Enhanced cursor extraction that works reliably
function extractCursorFromResponse(response) {
    try {
        const instructions = response?.data?.user?.result?.timeline?.timeline?.instructions || [];
        
        for (const instruction of instructions) {
            if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
                for (const entry of instruction.entries) {
                    // Look for bottom cursor
                    if (entry.entryId?.includes('cursor-bottom') || entry.entryId?.includes('cursor-showmorethreads')) {
                        if (entry.content?.value) {
                            return entry.content.value;
                        }
                        if (entry.content?.itemContent?.value) {
                            return entry.content.itemContent.value;
                        }
                    }
                }
            }
        }
        
        return null;
    } catch (error) {
        console.log(`⚠️ Error extracting cursor: ${error.message}`);
        return null;
    }
}

// FIXED: Main pagination function that ensures media collection
export async function scrapeUserMediaCompleteFixed(userId = "970834227221618688", maxPages = 20) {
    console.log(`🚀 Starting FIXED complete media scrape for user ${userId}`);
    console.log(`📄 Will fetch up to ${maxPages} pages`);
    console.log(`🔧 Using enhanced counting and pagination logic`);
    
    const results = [];
    let totalMedia = 0;
    let totalTweets = 0;
    let cursor = null;
    let pageCount = 0;
    let consecutiveEmptyPages = 0;
    
    while (pageCount < maxPages && consecutiveEmptyPages < 3) {
        console.log(`\n📄 Fetching page ${pageCount + 1}...`);
        
        try {
            const response = await request_yoshi_fixed(cursor);
            results.push(response);
            
            // Count media and tweets with enhanced logic
            const pageMediaCount = countMediaItemsComplete(response);
            const pageTweetCount = countTweetsComplete(response);
            
            totalMedia += pageMediaCount;
            totalTweets += pageTweetCount;
            
            console.log(`   📊 Page stats: ${pageMediaCount} media, ${pageTweetCount} tweets`);
            console.log(`   📈 Running total: ${totalMedia} media, ${totalTweets} tweets`);
            
            // Track empty pages
            if (pageMediaCount === 0 && pageTweetCount === 0) {
                consecutiveEmptyPages++;
                console.log(`   ⚠️ Empty page (${consecutiveEmptyPages}/3 consecutive)`);
            } else {
                consecutiveEmptyPages = 0;
            }
            
            // Extract next cursor
            const nextCursor = extractCursorFromResponse(response);
            
            if (!nextCursor) {
                console.log(`   ✅ No more pages available after page ${pageCount + 1}`);
                break;
            }
            
            // Avoid infinite loops
            if (nextCursor === cursor) {
                console.log(`   ⚠️ Cursor unchanged, stopping pagination`);
                break;
            }
            
            cursor = nextCursor;
            pageCount++;
            
            // Respectful delay between requests
            await new Promise(resolve => setTimeout(resolve, 3000));
            
        } catch (error) {
            console.error(`   ❌ Error on page ${pageCount + 1}: ${error.message}`);
            break;
        }
    }
    
    console.log(`\n📈 SCRAPING COMPLETE`);
    console.log(`📄 Total pages: ${results.length}`);
    console.log(`🐦 Total tweets: ${totalTweets}`);
    console.log(`🎬 Total media items: ${totalMedia}`);
    console.log(`📊 Media per tweet ratio: ${totalTweets > 0 ? (totalMedia / totalTweets).toFixed(2) : 'N/A'}`);
    
    return {
        pages: results,
        stats: {
            totalPages: results.length,
            totalTweets,
            totalMedia,
            mediaPerTweetRatio: totalTweets > 0 ? totalMedia / totalTweets : 0
        }
    };
}

// Count tweets in response
function countTweetsComplete(response) {
    let count = 0;
    
    try {
        const instructions = response?.data?.user?.result?.timeline?.timeline?.instructions || [];
        
        for (const instruction of instructions) {
            if (instruction.type === 'TimelineAddEntries' && instruction.entries) {
                for (const entry of instruction.entries) {
                    if (entry.content?.entryType === 'TimelineTimelineModule' && entry.content.items) {
                        for (const item of entry.content.items) {
                            if (item.entryId?.includes('tweet-')) {
                                count++;
                            }
                        }
                    } else if (entry.entryId?.startsWith('tweet-')) {
                        count++;
                    }
                }
            }
            
            if (instruction.type === 'TimelineAddToModule' && instruction.moduleItems) {
                count += instruction.moduleItems.length;
            }
        }
    } catch (error) {
        console.log(`⚠️ Error counting tweets: ${error.message}`);
    }
    
    return count;
}

// Generate random transaction ID
function generateTransactionId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 88; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export { request_yoshi_fixed as default };
