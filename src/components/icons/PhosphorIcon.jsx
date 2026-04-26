import React from 'react';

/**
 * PhosphorIcon Component
 * 
 * A wrapper component for Phosphor React icons that provides consistent styling
 * and makes it easy to use Phosphor icons throughout the application.
 * 
 * Usage:
 * import { Notebook, Books, Users, Storefront } from 'phosphor-react';
 * 
 * <PhosphorIcon icon={Notebook} size="w-5 h-5" />
 * <PhosphorIcon icon={Books} size="w-6 h-6" className="text-blue-500" />
 * 
 * Props:
 * - icon: The Phosphor icon component (e.g., Notebook, Books, Users, Storefront)
 * - size: CSS classes for sizing (default: "w-5 h-5")
 * - className: Additional CSS classes
 * - ...props: Any other props to pass to the icon component
 */
export default function PhosphorIcon({ icon: Icon, size = "w-5 h-5", className = "", ...props }) {
  return <Icon className={`${size} ${className}`} {...props} />;
}
