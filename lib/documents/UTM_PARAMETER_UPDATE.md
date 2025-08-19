# UTM Parameter Structure Update

## Overview

Updated the EmailGenius broadcast generator to use a standardized UTM parameter structure for better tracking and analytics consistency.

## New UTM Parameter Format

### Campaign Structure

- **Format:** `[country_code]_[brand]_[platform]_[type]`
- **Brand:** `tf` (TrafficForce)
- **Type:** `broad` (broadcast)

### Platform Codes

- **ActiveCampaign:** `ac`
- **ConvertKit:** `kit`

### Country Codes

- **United States:** `us`
- **Mexico:** `mx`
- **United Kingdom:** `uk`

## Complete UTM Structure

```txt
utm_source=[platform_name]
utm_medium=email
utm_campaign=[country_code]_tf_[platform]_broad
utm_term=broadcast
```

## Examples

### US Market

- **ActiveCampaign:** `utm_campaign=us_tf_ac_broad`
- **ConvertKit:** `utm_campaign=us_tf_kit_broad`

### Mexico Market

- **ActiveCampaign:** `utm_campaign=mx_tf_ac_broad`
- **ConvertKit:** `utm_campaign=mx_tf_kit_broad`

### UK Market

- **ActiveCampaign:** `utm_campaign=uk_tf_ac_broad`
- **ConvertKit:** `utm_campaign=uk_tf_kit_broad`

## Implementation Details

### Files Updated

- `/app/api/generate-broadcast/route.ts`: Updated system prompt with new UTM generation logic and example URLs

### Changes Made

1. Updated destination URL generation section with new UTM structure
2. Added comprehensive examples for all platform/market combinations
3. Updated example destination URLs in output formatting section
4. Added `utm_term=broadcast` parameter for additional categorization

## Benefits

- **Consistent Tracking:** Standardized format across all campaigns
- **Better Analytics:** Clear segmentation by country, platform, and campaign type
- **Improved Organization:** Easier to filter and analyze campaign performance
- **Scalable Structure:** Easy to add new countries or platforms

## Testing

- ✅ Application builds successfully
- ✅ Development server starts without errors
- ✅ All changes compiled properly

## Next Steps

1. Test generated emails to verify correct UTM parameter application
2. Validate URLs with new structure across different markets and platforms
3. Monitor analytics to ensure proper tracking implementation
