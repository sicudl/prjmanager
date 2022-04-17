module.exports = function ({action},{ exceptions, services, env, logger }) {

  const { MailService, ItemsService } = services;
  const { ServiceUnavailableException } = exceptions;
  const APPLICATION_SCOPE = 1;
  const PROJECT_SCOPE = 2;
  const statusTexts = {
    "toevaluate": "Pendent d'avaluació formal",
    "evaluating": "Avaluant",
    "aproving_prio": "Pendent d'aprovació / priorització",
    "aproved_prio": "Aprovat i prioritzat",
    "toexecute": "Preparat per execució",
    "waitforavailability": "En espera disponibiitat",
    "initiated": "Iniciat",
    "finished": "Finalitzat",
    "stopped": "Aturat",
    "archived": "Arxivat",
    "refused": "Rebutjat"
  };
  const APPLICATION_CREATION = "send_application_creation";
  const APPLICATION_ACCEPTED_REFUSED = "send_application_status_accepted_refused";
  const PROJECT_STATUS_CHANGE = "send_project_status_change";

  const lookForRecipient = async function (schema, accountability, applicationId, scope, generalPermission) {

    let recipients = [];
    const projectApplicationId = parseInt(applicationId, 10);

    const sourceCollection = (scope === APPLICATION_SCOPE )? "project_application" : "project"; 

    const appPrjService = new ItemsService(sourceCollection, {
      schema: schema,
      accountability: accountability,
    });

    const userService = new ItemsService("directus_users", {
      schema: schema,
      accountability: accountability,
    });

    const generalRoleFilter = {};
    generalRoleFilter[generalPermission] = {
      "_eq": true
    };

    

    const emailsByRole = await userService.readByQuery({
      filter: {
        role: generalRoleFilter,
      },
      fields: ["email"]
    }
    );

    recipients = recipients.concat(emailsByRole.map(item => item.email)
    );

    const application = await appPrjService.readByQuery({
      filter: {
        id: {
          _eq: projectApplicationId
        }
      },
      fields: ["status_update_email", "user_created.email", "promotors.promotor_id.promotor_user.email"]
    }
    );

    if (application.length > 0) {

      if (application[0].status_update_email) {
        recipients.push(application[0].status_update_email)
      }

      if (application[0].user_created && application[0].user_created.email && scope === APPLICATION_SCOPE) {
        recipients.push(application[0].user_created.email)
      }

      if (Array.isArray(application[0].promotors) && application[0].promotors.length > 0 && scope === APPLICATION_SCOPE) {
        let promotors = application[0].promotors;
        recipients = recipients.concat(promotors.map(item => {

          if (item.promotor_id.promotor_user && item.promotor_id.promotor_user.email) {
            return item.promotor_id.promotor_user.email;
          }
        }
        )).filter(Boolean);
      }

    }

    return recipients;
  };

  const notifyApplicationCreation = async function (schema, accountability, applicationId, applicationData) {

    const subject = `Nou projecte TIC sol·licitat`;

    const body =
      `<p>Benvolguda, benvolgut, <br />
S'ha introduït una nova sol·licitud de projecte al portal de projectes TIC.</p>
<ul>
  <li>Títol: ${applicationData.name} </li>
  <li>Unitat sol·licitant: ${applicationData.applicant_unit} </li>
  <li>Descripció de la necessitat: <div style="border: 1px solid #333333; padding: 10px;">${applicationData.description_need}</div></li>
</ul>    
<p>Podeu veure la sol·licitud a través del portal de projectes TIC a <a href="https://projectestic.udl.cat/admin/collections/project_application/${applicationId}">aquí</a></p>
<p>Salutacions</p>
`;

    const recipients = await lookForRecipient(schema, accountability, applicationId, APPLICATION_SCOPE, APPLICATION_CREATION)
    await sendEmail(schema, accountability, recipients, subject, body, applicationId);

  }

  const notifyApplicationAccepted = async function (schema, accountability, applicationId) {
    
    const applicationService = new ItemsService("project_application", {
      schema: schema,
      accountability: accountability,
    });

    const applications = await applicationService.readByQuery({
      filter: {
        id: {
          _eq: parseInt(applicationId, 10)
        }
      },
      fields: ["id","name","applicant_unit"]
    }
    );

    const applicationData = applications[0];

    const subject = `Sol·litud de projecte TIC acceptada, projecte creat`;

    const body =
      `<p>Benvolguda, benvolgut, <br />
La sol·licitud de projecte enviada ha estat avaluada i s'ha acceptat com a projecte. 
En aquest punt es farà una avaluació més exhaustiva tenint en compte els costos d'implementació.</p>
<ul>
  <li>Títol: ${applicationData.name} </li>
  <li>Unitat sol·licitant: ${applicationData.applicant_unit} </li>
</ul>    
<p>Podeu veure la sol·licitud a través del portal de projectes TIC a <a href="https://projectestic.udl.cat/admin/collections/project_application/${applicationData.id}">aquí</a></p>
<p>Salutacions</p>
`;

   const recipients = await lookForRecipient(schema, accountability, applicationId, APPLICATION_SCOPE, APPLICATION_ACCEPTED_REFUSED)

   //We get the project information, because we don't have it.
    await sendEmail(schema, accountability, recipients, subject, body, applicationId);
  }

  const notifyApplicationRefused = async function (schema, accountability, applicationId) {
    
    const applicationService = new ItemsService("project_application", {
      schema: schema,
      accountability: accountability,
    });

    const applications = await applicationService.readByQuery({
      filter: {
        id: {
          _eq: parseInt(applicationId, 10)
        }
      },
      fields: ["id","name","refuse_reasons"]
    }
    );

    const applicationData = applications[0];

    const subject = `Sol·litud de projecte TIC no acceptada`;

    const body =
      `<p> Benvolguda, benvolgut, <br />
Lamentem comunicar-vos que la sol·licitud de projecte amb títol <b>${applicationData.name}</b> enviada <b>no ha estat acceptada</b> 
i no entra a la cartera de projectes TIC. </p>

  <p>El motiu per refusar-la ha estat:</p>
    <div style="border: 1px solid #333333; padding: 10px;">${applicationData.refuse_reasons}</div>
  
  
<p>De totes formes, la sol·licitud queda encara registrada a l'aplicatiu <a href="https://projectestic.udl.cat/admin/collections/project_application/${applicationData.id}">aquí</a></p>
<p>Salutacions</p>
`;

const recipients = await lookForRecipient(schema, accountability, applicationId, APPLICATION_SCOPE, APPLICATION_ACCEPTED_REFUSED)

//We get the project information, because we don't have it.
 await sendEmail(schema, accountability, recipients, subject, body, applicationId);
}

const notifyProjectRefused = async function (schema, accountability, projectId) {
    
  const projectService = new ItemsService("project", {
    schema: schema,
    accountability: accountability,
  });

  const projects = await projectService.readByQuery({
    filter: {
      id: {
        _eq: parseInt(projectId, 10)
      }
    },
    fields: ["id","name","refuse_reasons"]
  }
  );



  const projectData = projects[0];

  const subject = `Projecte TIC rebutjat`;

  const body =
    `<p> Benvolguda, benvolgut, <br />
Lamentem comunicar-vos que el projecte amb títol <b>${projectData.name}</b> ha estat rebutjat, per tant surt de la cartera de projectes TIC. </p>

<p>El motiu per rebutjar-lo ha estat:</p>
<div style="border: 1px solid #333333; padding: 10px;">${projectData.refuse_reasons}</div>


<p>De totes formes, la sol·licitud queda encara registrada a l'aplicatiu <a href="https://projectestic.udl.cat/admin/collections/project/${projectData.id}">aquí</a></p>
<p>Salutacions</p>
`;


   const recipients = await lookForRecipient(schema, accountability, projectId, PROJECT_SCOPE, PROJECT_STATUS_CHANGE)

   //We get the project information, because we don't have it.
    await sendEmail(schema, accountability, recipients, subject, body, projectId);
  }

  const notifyProjectStatusChanged = async function (schema, accountability, projectId) {
    
    const projectService = new ItemsService("project", {
      schema: schema,
      accountability: accountability,
    });
  
    const projects = await projectService.readByQuery({
      filter: {
        id: {
          _eq: parseInt(projectId, 10)
        }
      },
      fields: ["id","name","status"]
    }
    );
  
  
  
    const projectData = projects[0];
  
    const subject = `Canvi en l'estat del projecte TIC`;
  
    const body =
      `<p> Benvolguda, benvolgut, <br />
  El projecte TIC <b>${projectData.name}</b> ha canviat a l'estat <b>${statusTexts[projectData.status]}</b> 
  Podeu conèixer el significat dels estats del projectes a la següent plana: <a href="https://confluence.udl.cat/display/PT/Estats+i+fases+del+projecte"> Estats del projecte</a>
  </p>
  
  <p>També podeu seguir la informació del projecte a l'aplicatiu <a href="https://projectestic.udl.cat/admin/collections/project/${projectData.id}">aquí</a></p>
  <p>Salutacions</p>
  `;
  
     const recipients = await lookForRecipient(schema, accountability, projectId, PROJECT_SCOPE, PROJECT_STATUS_CHANGE)
  
     //We get the project information, because we don't have it.
      await sendEmail(schema, accountability, recipients, subject, body, projectId);
    }
  

  const sendEmail = async function (schema, accountability, to, subject, body, projectId) {
    try {
      const comunicationEmailService = new MailService({
        schema: schema,
        accountability: accountability,
      });

      comunicationEmailService
        .send({
          cc: to,
          subject: subject,
          text: body,
          html: body,
        })
        .then((response) => {
          logger.info(
            "Comunication was send for project/application: " + projectId
          );
        })
        .catch((error) => {
          logger.info(
            "Error sending a comunication email for project/application: " + projectId
            + error
          );
        });
    } catch (error) {

      throw new ServiceUnavailableException(error);
    }
  }

  action ( 
    "items.create", async function (
      {collection, key, payload },
      {schema, accountability }) {

      if (collection === "project_application") {
        notifyApplicationCreation(schema, accountability, key, payload);
      }

    });

    action("items.update", async function (
      {collection, keys, payload }, 
      {schema, accountability }) {

      if (collection === "project_application") {
        if (payload.status) {
          if (payload.status === "accepted") {
            notifyApplicationAccepted(schema, accountability, keys[0]);
          }
          else if (payload.status === "refused") {
            notifyApplicationRefused(schema, accountability, keys[0]);
          }
        }
      }
      else if (collection === "project") {
        if (payload.status) {
          if (!["archived","refused"].includes(payload.status)) {
            notifyProjectStatusChanged(schema, accountability, keys[0]);
          } else if (payload.status === "refused") {
            notifyProjectRefused(schema, accountability, keys[0]);
          }
        }
      }
    });
};
