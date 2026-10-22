import { createStore } from 'vuex';

export default createStore({
  state: {
    editorSelectedCategory: '标题'
  },
  getters: {
    getSelectedCategory: (state) => state.editorSelectedCategory
  },
  mutations: {
    setSelectedCategory(state, category) {
      state.editorSelectedCategory = category;
    }
  }
});
