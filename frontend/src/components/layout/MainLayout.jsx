/** Mục đích: Layout tổng gồm Header, Sidebar, content (Outlet), Footer. */
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
export default function MainLayout(){ return <Box><Header /><Box display='flex'><Sidebar /><Box component='main' flex={1}><Outlet /></Box></Box><Footer /></Box>; }
