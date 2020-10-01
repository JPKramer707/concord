const moduleName = 'test';
const { store } = require('./store');

const setup = () => {
	store.createCallbackType(moduleName);
	store.registerCallback(moduleName, () => store.pushMessage(moduleName));
	store.registerCallback('regularly', store.runCallbacks.bind(null, moduleName));
};

exports.setup = setup;
exports.moduleName = moduleName;
