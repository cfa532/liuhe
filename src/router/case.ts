import { NewCase, EditCase, Layout } from "@/views/cases";

export default {
    path: '/case',
    component: Layout,
    children: [
        { path: '', component: NewCase},
        { path: 'add', component: NewCase },
        { path: 'edit/:id', component: EditCase }
    ]

}