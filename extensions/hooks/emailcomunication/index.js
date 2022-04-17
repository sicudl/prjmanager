module.exports = function ({action}, { exceptions, services, logger }) {
  const collections = ["comunication"];
  const { MailService, ItemsService } = services;
  const { ServiceUnavailableException } = exceptions;

  action("items.create", async function ({
      collection, key, payload },
      {schema, accountability }) {
      if (collections.includes(collection)) {
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
                  key +
                  " was sent. Project ID: " +
                  payload.project_id
              );
            })
            .catch((error) => {
              logger.info(
                "Error sending a comunication email for item: " + key,
                error
              );
            });
        } catch (error) {
          throw new ServiceUnavailableException(error);
        } finally {
        }
      }
    });
};
