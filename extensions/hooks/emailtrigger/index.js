module.exports = function registerHook({ exceptions, services, env }) {


  const { MailService, ItemsService } = services;
  const { ServiceUnavailableException } = exceptions;

  const logger = require("directus/dist/logger").default;

  const checkTriggers =  async function (schema, accountability, collection, on_action) {
    const mailtriggerService = new ItemsService("mail_trigger", {
      schema: schema,
      accountability: accountability,
    });

    return stakeholderService.readByQuery({
      filter: {
        _and: {
          collection_name: {
            _eq: collection,
          },
          on: {
            _eq: on_action,
          },
        }
      },
    });
  };


  return {
    "items.create": async function ({
      collection,
      item,
      payload,
      schema,
      accountability,
    }) {

      const triggers = await checkTriggers (schema, accountability, collection , "create");

      console.log ("Triggers", triggers);


    /*  if (collections.includes(collection)) {
        try {
          //Get the email from selected stakeholders
          const stakeholderService = new ItemsService("stakeholders", {
            schema: schema,
            accountability: accountability,
          });

          const stakeholderKeys = payload.recipients.map(
            (item) => item.stakeholders_id
          );

          const result = await stakeholderService.readByQuery({
            filter: {
              id: {
                _in: stakeholderKeys,
              },
            },
          });

          const to = result.map((item) => item.email);

          const comunicationEmailService = new MailService({
            schema: schema,
            accountability: accountability,
          });

          //Send the email
          comunicationEmailService
            .send({
              cc: to,
              subject: payload.title,
              text: payload.body,
            })
            .then((response) => {
              logger.info(
                "Comunication id " +
                  item +
                  " was sent. Project ID: " +
                  payload.project_id
              );
            })
            .catch((error) => {
              logger.info(
                "Error sending a comunication email for item: " + item,
                error
              );
            });
        } catch (error) {
          throw new ServiceUnavailableException(error);
        } finally {
        }
      }*/
    },
  };
};
