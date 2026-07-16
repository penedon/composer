import { createRouter, createWebHistory } from 'vue-router'

const ProjectLibraryPage = () => import('@presentation/pages/ProjectLibraryPage/ProjectLibraryPage.vue')
const WorkspacePage = () => import('@presentation/pages/WorkspacePage/WorkspacePage.vue')

export const phases = ['story', 'frame', 'emotions', 'structure', 'compose', 'arrange', 'export'] as const
export type Phase = (typeof phases)[number]

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/projects' },
    { path: '/projects', name: 'projects', component: ProjectLibraryPage },
    {
      path: '/projects/:projectId/:phase(story|frame|emotions|structure|compose|arrange|export)',
      name: 'workspace',
      component: WorkspacePage,
      props: true,
    },
    { path: '/:pathMatch(.*)*', redirect: '/projects' },
  ],
})
