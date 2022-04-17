module.exports = function ({ init }, { env }) {

    const role = {
        pr_inspector: 'e0417ae7-70af-4e23-a764-17eb9fbf7faf',
        pr_applicant: '3db98abc-2e53-438d-8a05-730e23225fe4',
        promotor: '1189b8f5-26d8-4826-bfff-1cccb6be1911',
        pr_manager: 'dc43b52c-a1ac-40df-85be-066964407923'
    }

    init('middlewares.after', async ({ app }) => {
      app.use(function (req, res, next) {
        if(req.originalUrl === '/settings') { //Hide modules
          const send = res.send;
          res.send = function (body) {
            let parsedBody = JSON.parse(body);
            if (parsedBody.data.module_bar) {
              if ([role.pr_applicant, role.pr_inspector, role.promotor, role.pr_manager].includes (req.accountability.role)) {
                parsedBody.data.module_bar.find(m => m.id === 'users').enabled = false;
                parsedBody.data.module_bar.find(m => m.id === 'files').enabled = false;
                parsedBody.data.module_bar.find(m => m.id === 'docs').enabled = false;
                if (role.pr_manager !== req.accountability.role) {
                    parsedBody.data.module_bar.find(m => m.id === 'comunications').enabled = false;
                }
              }
    
            }
            send.apply(this, [JSON.stringify(parsedBody)]);
          };
        } else if (req.originalUrl === '/collections?limit=-1') { //Hide collections
          const send = res.send;
          res.send = function (body) {
            let parsedBody = JSON.parse(body);
            if (parsedBody.data) {
                
                if ([role.pr_applicant, role.pr_inspector, role.promotor].includes (req.accountability.role)) { 
                    parsedBody.data.find (m => m.collection === 'promotor').meta.hidden = true;
                    parsedBody.data.find (m => m.collection === 'strategic_axis').meta.hidden = true;
                }
 
                if ([role.pr_inspector,role.promotor].includes (req.accountability.role)){
                    parsedBody.data.find (m => m.collection === 'milestone').meta.hidden = true;
                    parsedBody.data.find (m => m.collection === 'stakeholders').meta.hidden = true;
                    parsedBody.data.find (m => m.collection === 'workactions').meta.hidden = true;
                }
        
             }
            send.apply(this, [JSON.stringify(parsedBody)]);
          };
        }
        next();
      });
    });
  };