# MetaPulse Logo Configuration

## 🎨 Logo Details

### IPFS Hosting
- **Provider**: Pinata Cloud
- **IPFS Hash**: `bafybeiebtjeaklp5bvn3bwvsc6dlellhhhpr4oxcjpsvsx5v7icnvpswqm`
- **URL**: https://crimson-traditional-mastodon-846.mypinata.cloud/ipfs/bafybeiebtjeaklp5bvn3bwvsc6dlellhhhpr4oxcjpsvsx5v7icnvpswqm
- **Format**: GIF (animated)
- **Size**: Optimized for web use

### Implementation

#### Logo Component (`apps/web/app/components/Logo.tsx`)
```typescript
// Primary source: IPFS
src="https://crimson-traditional-mastodon-846.mypinata.cloud/ipfs/bafybeiebtjeaklp5bvn3bwvsc6dlellhhhpr4oxcjpsvsx5v7icnvpswqm"

// Fallback: "MP" with gradient
fallback={<span className="text-white font-bold">MP</span>}
```

#### Next.js Configuration (`apps/web/next.config.js`)
```javascript
images: {
  domains: ['crimson-traditional-mastodon-846.mypinata.cloud'],
  formats: ['image/gif', 'image/webp', 'image/avif'],
  unoptimized: true
}
```

### Fallback Strategy

1. **Primary**: IPFS-hosted GIF logo
2. **Secondary**: "MP" text with gradient background
3. **Error Handling**: Automatic fallback on load failure
4. **Performance**: Optimized loading with priority

### Usage

#### Different Sizes
```typescript
<Logo size="sm" />   // 32x32px
<Logo size="md" />   // 48x48px (default)
<Logo size="lg" />   // 64x64px
<Logo size="xl" />   // 96x96px
```

#### Custom Styling
```typescript
<Logo className="rounded-full border-2 border-blue-500" />
```

### Benefits

#### ✅ Decentralized
- **IPFS**: Decentralized storage, no single point of failure
- **Pinata**: Reliable IPFS gateway with global CDN
- **Permanent**: Content-addressed, immutable

#### ✅ Performance
- **Optimized**: Compressed GIF for web use
- **Cached**: Browser and CDN caching
- **Fast**: Global edge locations

#### ✅ Reliability
- **Fallback**: Automatic fallback to text logo
- **Error Handling**: Graceful degradation
- **Cross-platform**: Works on all devices

### Testing

#### Local Test
```bash
# Open test file
open test-logo.html

# Or visit in browser
http://localhost:5174
```

#### Production Test
- Check Railway deployment
- Verify logo loads correctly
- Test fallback behavior
- Monitor performance

### Maintenance

#### Logo Updates
1. Upload new logo to IPFS
2. Update IPFS hash in component
3. Test fallback behavior
4. Deploy to production

#### Monitoring
- Logo load success rate
- Fallback usage frequency
- Performance metrics
- User feedback

---

**MetaPulse Logo is now IPFS-hosted with automatic fallback!** 🎨✨
