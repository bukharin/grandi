declare module "node-gyp-build" {
	type Loader = (path?: string) => unknown;
	const load: Loader;
	export default load;
}
