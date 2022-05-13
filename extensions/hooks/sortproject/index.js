module.exports = ({filter,action},{ exceptions, services, env, logger }) => {

    const { ItemsService, UtilsService } = services;
  
    const { ServiceUnavailableException } = exceptions;
  
    //We use a filter because we will modify the sort number before 
    //the item is stored (shoud be performed by someone with permission)
    filter ("project.items.update", async function (input, {keys, collection},{schema,
        accountability}) {

            //check if request is archiving the item
            if (input.archive && input.archive === 'archived') {
                const projectService = new ItemsService("project", {
                    schema: schema,
                    accountability: accountability,
                  });
        

                //Look for the last project
                const projects = await projectService.readByQuery ({
                    sort: ['approved_global_priority'],
                    fields: ["approved_global_priority"]
                });

                if (projects) { //Mechanism will work after second archived item
                    input.approved_global_priority = projects[projects.length-1].approved_global_priority + 1;
                } 
            }
            return input;
        });

    // When a project is already archivated with a last sort number, it's time to reorder the list    
    action ("project.items.update" , async function ({payload},{schema,
        accountability}) {
        //if something is archived force a a sortt   

        if (payload.archive && payload.archive === 'archived') {
            try {
              //Reset all the project order
              
              const projectService = new ItemsService("project", {
                schema: schema,
                accountability: accountability,
              });

              const projects = await projectService.readByQuery ({
                filter: {},
                sort: ['approved_global_priority'],
                fields: ["id"]
            });

          
              // This might not scale that well, but I don't really know how to accurately set all rows
              // to a sequential value that works cross-DB vendor otherwise
              for (let i = 0; i < projects.length; i++) {
                  await projectService.updateOne (projects[i].id,{approved_global_priority: i +1})
              }

            } catch (error) {
                logger.info ("Unable to refresh sort");
            }
        }

    });

    filter ("project.items.create", async function (input,{keys, collection},{schema,
        accountability}) {
           
        const projectService = new ItemsService("project", {
            schema: schema,
            accountability: accountability,
            });

        //Look for the last project
        const projects = await projectService.readByQuery ({
            sort: ['approved_global_priority'],
            fields: ["approved_global_priority"]
        });

        if (projects) { //Mechanism will work after second archived item
            input.approved_global_priority = projects[projects.length-1].approved_global_priority + 1;
        } 

        return input;

    });


    action ("project.items.create", async function ({payload, key},{schema,
        accountability}) {
       
            const projectService = new ItemsService("project", {
                schema: schema,
                accountability: accountability,
                });
    
            //Look for the last project
            const projects = await projectService.readByQuery ({
                filter: {'archive': 'archived'},
                sort: ['approved_global_priority'],
                fields: ['id','approved_global_priority']
            });
            
            if (projects) { //It means that new project must take over the archived projects
                const currentProject = key;
                const firstArchivedProject = projects[0].id;
                
               const utilService = new UtilsService({
                    accountability: accountability,
                    schema: schema,
                });

                utilService.sort ('project',{item: currentProject,to: firstArchivedProject});
            }

    });

    
    
    };