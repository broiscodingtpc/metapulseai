// Helper to extract image from token metadata
export async function getTokenImage(metadataUri: string, tokenAddress: string): Promise<string> {
  try {
    // Direct IPFS image link
    if (metadataUri.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
      return metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // Try to fetch metadata JSON
    if (metadataUri.includes('ipfs') || metadataUri.includes('metadata')) {
      const url = metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
      
      try {
        const response = await fetch(url, {
          next: { revalidate: 3600 }, // Cache for 1 hour
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Check for image in metadata
          if (data.image) {
            return data.image.replace('ipfs://', 'https://ipfs.io/ipfs/');
          }
          
          // Check for icon
          if (data.icon) {
            return data.icon.replace('ipfs://', 'https://ipfs.io/ipfs/');
          }
          
          // Check for logo_uri (Metaplex standard)
          if (data.logo_uri) {
            return data.logo_uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
          }
        }
      } catch (fetchError) {
        // Metadata fetch failed, use fallback
      }
    }
  } catch (error) {
    // Any error, use fallback
  }
  
  // Fallback to generated SVG
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenAddress}&backgroundColor=1a1e27`;
}

// Simplified version for client-side use
export function getTokenImageUrl(metadataUri?: string, tokenAddress?: string): string {
  if (!metadataUri || !tokenAddress) {
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenAddress || 'default'}&backgroundColor=1a1e27`;
  }
  
  // Direct image link
  if (metadataUri.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
    return metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  
  // For metadata URIs, we'll try to load them as images
  // If it fails, the onError handler will show the emoji fallback
  if (metadataUri.includes('ipfs')) {
    return metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  
  // For other metadata services, use as-is
  if (metadataUri.includes('metadata') || metadataUri.includes('http')) {
    return metadataUri;
  }
  
  // Fallback
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${tokenAddress}&backgroundColor=1a1e27`;
}

