declare module "figma:asset" {
  const anyAssetDir: string;
  export default anyAssetDir;
}

declare module "figma:asset/*" {
  const src: string;
  export default src;
}
