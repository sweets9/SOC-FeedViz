/**
 * Utility functions for RSS feed parsing and processing
 */

/**
 * Get text content from XML node
 */
export function getNodeText(parent, tagName) {
  const node = parent.querySelector(tagName);
  return node ? node.textContent.trim() : '';
}

/**
 * Get attribute from XML node
 */
export function getNodeAttr(parent, tagName, attrName) {
  const node = parent.querySelector(tagName);
  return node ? node.getAttribute(attrName) : '';
}

/**
 * Parse date from RSS item
 */
export function parseDate(itemNode) {
  const dateStr = getNodeText(itemNode, 'pubDate') ||
    getNodeText(itemNode, 'published') ||
    getNodeText(itemNode, 'updated') ||
    getNodeAttr(itemNode, 'published', 'datetime');
  
  if (!dateStr) return new Date();
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
}

/**
 * Extract image from RSS item
 */
export function extractImage(itemNode) {
  // Try media:content
  const mediaContent = itemNode.querySelector('media\\:content, content');
  if (mediaContent) {
    const url = mediaContent.getAttribute('url') || getNodeAttr(mediaContent, 'url', 'url');
    if (url) return url;
  }

  // Try enclosure
  const enclosure = itemNode.querySelector('enclosure');
  if (enclosure && enclosure.getAttribute('type')?.startsWith('image/')) {
    return enclosure.getAttribute('url');
  }

  // Try media:thumbnail
  const thumbnail = itemNode.querySelector('media\\:thumbnail, thumbnail');
  if (thumbnail) {
    return thumbnail.getAttribute('url') || getNodeAttr(thumbnail, 'url', 'url');
  }

  // Try extracting from description HTML
  const description = getNodeText(itemNode, 'description') ||
    getNodeText(itemNode, 'summary') ||
    getNodeText(itemNode, 'content') || '';
  
  const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  return null;
}

/**
 * Remove feed-specific metadata noise before parsing text
 */
export function preprocessFeedHtml(html, feedName) {
  if (!feedName || !html) {
    return html;
  }

  const lowerName = feedName.toLowerCase();

  if (lowerName.includes('hacker news')) {
    try {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      const firstParagraph = wrapper.querySelector('p');
      if (firstParagraph && firstParagraph.textContent.trim().startsWith('')) {
        firstParagraph.remove();
      }
      return wrapper.innerHTML;
    } catch (error) {
      console.warn('Failed to preprocess Hacker News description', error);
    }
  }

  return html;
}

/**
 * Extract first paragraph from HTML content
 */
export function extractFirstParagraph(html, feedName) {
  if (!html) return '';

  const normalizedHtml = preprocessFeedHtml(html, feedName);

  // Preserve paragraph breaks and line breaks
  let text = normalizedHtml
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Get first sentence or up to 200 characters
  const sentences = text.split(/[.!?]+/);
  let paragraph = sentences[0] || text;

  if (paragraph.length > 250) {
    paragraph = paragraph.substring(0, 250) + '...';
  } else if (sentences.length > 1 && paragraph.length < 150) {
    paragraph += '. ' + sentences[1];
    if (paragraph.length > 250) {
      paragraph = paragraph.substring(0, 250) + '...';
    }
  }

  return paragraph;
}

/**
 * Parse RSS XML document into items array
 */
export function parseRSSItems(xmlDoc, feedName, feedIcon, maxItems = 5) {
  const items = [];
  const itemNodes = xmlDoc.querySelectorAll('item, entry');

  itemNodes.forEach((itemNode, index) => {
    if (index >= maxItems) return;

    const rawDescription = getNodeText(itemNode, 'description') ||
      getNodeText(itemNode, 'summary') ||
      getNodeText(itemNode, 'content') || '';

    const item = {
      id: `${feedName}-${index}-${Date.now()}`,
      title: getNodeText(itemNode, 'title') || 'No title',
      link: getNodeText(itemNode, 'link') || getNodeAttr(itemNode, 'link', 'href') || '#',
      pubDate: parseDate(itemNode),
      source: feedName,
      sourceIcon: feedIcon,
      description: extractFirstParagraph(rawDescription, feedName),
      image: extractImage(itemNode)
    };

    items.push(item);
  });

  return items;
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(date) {
  if (!date) return '';
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Check if item is critical based on keywords
 */
export function isCritical(item, keywords = []) {
  if (!keywords || keywords.length === 0) return false;
  const text = `${item.title} ${item.description}`.toLowerCase();
  return keywords.some(keyword => text.includes(keyword.toLowerCase()));
}

