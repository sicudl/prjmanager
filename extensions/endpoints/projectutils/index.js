module.exports = function registerEndpoint(router, { services, exceptions }) {
	const { ItemsService } = services;
	const { ServiceUnavailableException } = exceptions;

	router.get('/acceptproject', (req, res, next) => {
		const projectService = new ItemsService('project', { schema: req.schema, accountability: req.accountability });

		console.log ('schema', req.schema);
		projectService
			.readByQuery({ fields: ['*'] })
			.then((results) => res.json(results))
			.catch((error) => {
				return next(new ServiceUnavailableException(error.message));
			});
	});
};
