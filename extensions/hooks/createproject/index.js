module.exports = function registerHook({ exceptions, services, env }) {
  const collections = ["project_application"];
  const { ItemsService } = services;

  const { ServiceUnavailableException } = exceptions;

  return {
    "items.update": async function ({
      collection,
      item,
      payload,
      schema,
      accountability,
    }) {
      if (collections.includes(collection)) {
        const project_application_id = parseInt(item, 10);

        //check if in status comes with the payload, if it's accepted look for a project with that application and if it not exists then create one with valueble data.
        if (payload.status && payload.status === "accepted") {
          const projectService = new ItemsService("project", {
            schema: schema,
            accountability: accountability,
          });

          const projectApplicationService = new ItemsService(
            "project_application",
            {
              schema: schema,
              accountability: accountability,
            }
          );
          
          const applicationPromotorsService = new ItemsService(
            "project_application_promotor",
            {
              schema: schema,
              accountability: accountability,
            }
          ); 

          const strategyAxesService = new ItemsService(
            "project_application_strategic_axis",
            {
              schema: schema,
              accountability: accountability,
            }
          ); 

          try {
            const result = await projectService.readByQuery({
              filter: {project_application_id: project_application_id },
            });

            //check the result, if empty
            if (result.length == 0) {
              //Look for the project application data to create the project
              const pa_result = await projectApplicationService.readOne(
                project_application_id
              );

              //Look for the promotors ids
              const aprom_results = await applicationPromotorsService.readByQuery ({
                filter: {project_application_id: project_application_id}
              , fields: ["promotor_id"]});

              //Look for strategic axes
              const straxis_results = await strategyAxesService.readByQuery ({
                filter: {project_application_id: project_application_id}
              , fields: ["strategic_axis_id"]});

              await projectService.createOne({
                project_application_id: pa_result.id,
                promotors: aprom_results,
                strategy_axes: straxis_results,
                applicant_unit: pa_result.applicant_unit,
                application_responsible: pa_result.application_responsible,
                status_update_email: pa_result.status_update_email,
                name: pa_result.name,
              });
            }
          } catch (error) {
            throw new ServiceUnavailableException(error);
          } finally {
          
          }
        }
      }
    },
  };
};
