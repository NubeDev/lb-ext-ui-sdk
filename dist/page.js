// The PAGE mount contract — the seam every extension's federated page exposes from its `remoteEntry.js`.
//
// This is the authoritative definition (ui-federation scope). The host shell (`lb`) imports these
// types from THIS package; an extension's page implements `RemoteMount`. Frozen: changing the call
// signature is a breaking (major) release of this package.
export {};
//# sourceMappingURL=page.js.map