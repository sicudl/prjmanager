import ModuleComponent from './module.vue';
import {useApi} from '@directus/extensions-sdk'

export default {
	id: 'comunications',
	name: 'Comunications',
	icon: 'mail',
	routes: [
		{
			path: '', component: ModuleComponent,
		},
	],
	setup() {
		const api = useApi();
	}
};
