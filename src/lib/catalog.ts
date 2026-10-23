/** Fixed option lists for the listing form. */

export const CATEGORIES: Record<string, string[]> = {
  "Women's Apparel": ['Dresses', 'Tops', 'Skirts', 'Trousers', 'Outerwear', 'Two-Piece Sets'],
  "Men's Apparel": ['Agbada & Kaftans', 'Shirts', 'Trousers', 'Outerwear', 'Hoodies & Sweats'],
  Accessories: ['Hats & Caps', 'Scarves', 'Jewellery', 'Belts'],
  Bags: ['Clutches', 'Handbags', 'Totes'],
  Shoes: ['Heels', 'Sandals', 'Flats', 'Sneakers'],
};

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'One size'];

export interface Swatch {
  name: string;
  /** CSS background for the swatch circle. */
  fill: string;
  /** Shown before "show all" is pressed. */
  primary?: boolean;
}

export const COLOURS: Swatch[] = [
  { name: 'Rose', fill: '#c84771', primary: true },
  { name: 'Indigo', fill: '#211e8a', primary: true },
  { name: 'Green', fill: '#15803d', primary: true },
  { name: 'Amber', fill: '#d97706', primary: true },
  { name: 'Yellow', fill: '#d9d906', primary: true },
  { name: 'Purple', fill: '#5e06d9', primary: true },
  { name: 'Red', fill: '#d90606', primary: true },
  { name: 'Teal', fill: '#06d9c0', primary: true },
  { name: 'Black', fill: '#111111' },
  { name: 'White', fill: '#ffffff' },
  { name: 'Navy', fill: '#1e3a5f' },
  { name: 'Brown', fill: '#7c4a2d' },
  { name: 'Beige', fill: '#d8c3a5' },
  { name: 'Grey', fill: '#9ca3af' },
  { name: 'Gold', fill: '#cf9e4e' },
  { name: 'Multi', fill: 'conic-gradient(#d90606, #d9d906, #15803d, #06d9c0, #211e8a, #5e06d9, #d90606)' },
];

export const OCCASIONS = ['Casual', 'Party', 'Wedding', 'Date Night', 'Office'];

export const FITS = ['Regular Fit', 'Slim Fit', 'Relaxed Fit', 'Oversized', 'Tailored'];

export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
