<template>
  <private-view title="Envia una comunicació">
	
	<div class="form grid with-fill">

		<div class="field full">
			<div class="label type-label" ><span>Projecte:</span></div>
			<v-select item-text="name" item-value="id" 
				v-model="selectedProject" :items="projects" />
		</div>
		<div class="field full">
			<div class="label type-label" ><span>Interessats/des:</span></div>
			<v-select label="Interessats" item-text="name" item-value="id" 
				v-model="selectedStakeholders" multiple="true" :items="stakeholders" />
		</div>
		<div class="field full">
			<div class="label type-label" ><span>Assumpte:</span></div>
			<v-input v-model="title" />
		</div>
		<div class="field full">
			<div class="label type-label" ><span>Cos:</span></div>
			<v-textarea  v-model="body" />
		</div>
		<div class="field full">
			<v-button v-on:click="sendComunication">Click me!</v-button>
		</div>
	</div>
  </private-view>
</template>

<style>
.form {
	display: grid;
	padding: var(--content-padding);
    padding-bottom: var(--content-padding-bottom);
	gap: var(--form-vertical-gap) var(--form-horizontal-gap);
}
.with-fill {
	grid-template-columns: [start] minmax(0,var(--form-column-max-width)) [half] minmax(0,var(--form-column-max-width)) [full] 1fr [fill];
}
.field {
	    position: relative;
}

.form .full{
	grid-column: start/full;
}
.label {
    position: relative;
    display: flex;
    width: max-content;
    margin-bottom: 8px;
    cursor: pointer;
}

.type-label {
    color: var(--foreground-normal-alt);
    font-weight: 600;
    font-size: 16px;
    font-family: var(--family-sans-serif);
    font-style: normal;
    line-height: 19px;
}
</style>


<script>
export default {
  data() {
    return {
      collections: null,
	  selectedProject: null,
      projects: [],
	  selectedStakeholders: [],
      stakeholders: [],
	  title: "",
	  body: "",
    };
  },
  methods: {
	projectChanged: function (evt) {
		console.log ("Changed");
	},
    sendComunication: function () {
		var comunication = {
			title: this.title,
			body: this.body,
			project_id: this.selectedProject,
			recipients : this.selectedStakeholders.map (stakeholder => { return {"stakeholders_id": stakeholder}} ),
		}
		this.system.api.post("/items/comunication",comunication).then((res) => {
			console.log ("OK");
		}).catch ((error) => {
			console.log (error);
		});
	},
	loadStakeholders: function (projectId) {
		this.system.api.get("/items/stakeholders?limit=-1&?filter[project_id][_eq]="+projectId).then((res) => {
			this.selectedStakeholders = [];
			this.stakeholders = res.data.data;
		});
	}
  },watch: {
	  selectedProject: function (newVal) {
		  this.loadStakeholders (newVal);
	  }	
  }
  ,
  inject: ["system"],
  mounted() {
	//Pre-set the project


	//Get the project id to send the comunication, if not present enable the project Selector

    //If the project Id is set up get the project stackeholders to choose them

    // Get a list of all available collections to use with this module
    /*this.system.api.get("/collections?limit=-1").then((res) => {
      this.collections = res.data.data;
    });*/

    this.system.api.get("/items/project?limit=-1").then((res) => {
      this.projects = res.data.data;
	  
	  if (this.$route.query.id) {
         const selProject = this.projects.find(item => item.id === parseInt(this.$route.query.id));

	 	if (selProject) {
		  this.selectedProject = parseInt(this.$route.query.id);
	    } 
	  }
	});

    console.log("selectedProject", this.selectedProject);
  },
};
</script>
