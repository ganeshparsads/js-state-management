import PubSub from '../lib/pubsub.js';
export default class Store {
    constructor(params) {
        let self = this;

        // Add some default objects to hold our actions, mutations and state
        self.actions = {};
        self.mutations = {};
        self.state = {};

        // A status enum to set during actions and mutations
        self.status = 'resting';

        // Attach our PubSub module as an `events` element
        self.events = new PubSub();

        // Look in the passed params object for actions and mutations 
        // that might have been passed in
        if (params.hasOwnProperty('actions')) {
            self.actions = params.actions;
        }

        if (params.hasOwnProperty('mutations')) {
            self.mutations = params.mutations;
        }

        // Set our state to be a Proxy. We are setting the default state by 
        // checking the params and defaulting to an empty object if no default 
        // state is passed in
        // For proxy: https://www.keithcirkel.co.uk/metaprogramming-in-es6-part-3-proxies/
        self.state = new Proxy((params.state || {}), {
            set: function(state, key, value) {
                
                // Set the value as we would normally
                state[key] = value;
                
                // Trace out to the console. This will be grouped by the related action
                console.log(`stateChange: ${key}: ${value}`);
                
                // Publish the change event for the components that are listening
                self.events.publish('stateChange', self.state);
                
                // Give the user a little telling off if they set a value directly
                if(self.status !== 'mutation') {
                    console.warn(`You should use a mutation to set ${key}`);
                }
                
                // Reset the status ready for the next operation
                self.status = 'resting';
                
                return true;
            }
        });
    }

    dispatch(actionKey, payload) {

        let self = this;
      
        if(typeof self.actions[actionKey] !== 'function') {
          console.error(`Action "${actionKey} doesn't exist.`);
          return false;
        }
      
        console.groupCollapsed(`ACTION: ${actionKey}`);
      
        self.status = 'action';
      
        self.actions[actionKey](self, payload);
      
        console.groupEnd();
      
        return true;
    }

    commit(mutationKey, payload) {
        let self = this;
      
        if(typeof self.mutations[mutationKey] !== 'function') {
          console.log(`Mutation "${mutationKey}" doesn't exist`);
          return false;
        }
      
        self.status = 'mutation';
      
        let newState = self.mutations[mutationKey](self.state, payload);
      
        self.state = Object.assign(self.state, newState);
      
        return true;
    }

}
