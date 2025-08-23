/**
 * Permission utility functions for role-based access control
 */

/**
 * Check if user has content management permissions (admin or maintainer)
 * Content managers can add, edit, and delete videos and documents
 */
export function isContentManager(role: string): boolean {
  return role === "admin" || role === "maintainer";
}

/**
 * Check if user has admin permissions
 * Admins can manage users (approve/reject/delete) in addition to content management
 */
export function isAdmin(role: string): boolean {
  return role === "admin";
}