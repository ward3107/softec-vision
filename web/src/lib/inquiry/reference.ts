/** Short, human-friendly form of an inquiry id, shown to the customer and in the admin. */
export const shortReference = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase();
