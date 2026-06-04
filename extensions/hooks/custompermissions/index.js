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
            let parsedBody;
            try {
              parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
            } catch (err) {
              return send.apply(this, [body]);
            }

            if (parsedBody?.data?.module_bar) {
              if ([role.pr_applicant, role.pr_inspector, role.promotor, role.pr_manager].includes(req.accountability.role)) {
                const moduleBar = parsedBody.data.module_bar;
                const hideModule = id => moduleBarfind(m => m.id === id)?.enabled = false;

                hideModule('users');
                hideModule('files');
                hideModule('docs');
                if (role.pr_manager !== req.accountability.role) {
                  hideModule('comunications');
                }
              }
            }

            send.apply(this, [JSON.stringify(parsedBody)]);
          };
        } else if (req.originalUrl === '/collections?limit=-1') { //Hide collections
          const send = res.send;
          res.send = function (body) {
            let parsedBody;
            try {
              parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
            } catch (err) {
              return send.apply(this, [body]);
            }

            if (Array.isArray(parsedBody?.data)) {
              const hideCollection = collectionId => {
                const item = parsedBody.data.find(m => m.collection === collectionId);
                if (item?.meta) item.meta.hidden = true;
              };

              if ([role.pr_applicant, role.pr_inspector, role.promotor].includes(req.accountability.role)) {
                hideCollection('promotor');
                hideCollection('strategic_axis');
              }

              if ([role.pr_inspector, role.promotor].includes(req.accountability.role)) {
                hideCollection('milestone');
                hideCollection('stakeholders');
                hideCollection('workactions');
              }
            }

            send.apply(this, [JSON.stringify(parsedBody)]);
          };
        }
        next();
      });
    });
  };