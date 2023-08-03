import { NewCase, EditCase, Layout } from "@/views/cases";

export default {
    path: '/case',
    component: Layout,
    children: [
        { path: '', component: Intro},
        { path: 'add', component: NewCase },
        { path: '/:id', component: EditCase }
    ]

}