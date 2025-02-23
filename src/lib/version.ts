export const getVersion = () => {
  return import.meta.env.VITE_APP_VERSION || '1.0.0';
};