import { NewCase, EditCase, Layout, Intro } from "@/views/cases";

export default {
    path: '/case',
    component: Layout,
    children: [
        { path: '', component: Intro},
        { path: 'add', component: NewCase },
        { path: 'edit/:id', component: NewCase }
    ]

}