import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import InboxPage from './InboxPage';
import OutboxPage from './OutboxPage';
import GroupsPage from './GroupsPage';

const TABS = [
  {
    label: 'Hộp thư đến',
    icon: <InboxOutlinedIcon sx={{ fontSize: 17 }} />,
  },
  {
    label: 'Đã gửi',
    icon: <SendOutlinedIcon sx={{ fontSize: 17 }} />,
  },
  {
    label: 'Nhóm',
    icon: <GroupsOutlinedIcon sx={{ fontSize: 17 }} />,
  },
];

export default function RequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseInt(searchParams.get('tab') || '0', 10);

  const setTab = (newTab: number) => {
    setSearchParams({ tab: newTab.toString() }, { replace: true });
  };

	const tabsNode = (
		<Box sx={{
			display: 'inline-flex',
			gap: 0.75,
			p: 0.75,
			bgcolor: 'action.hover',
			borderRadius: '14px',
			boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
		}}>
			{TABS.map((t, i) => (
				<Box
					key={i}
					onClick={() => setTab(i)}
					sx={{
						display: 'flex',
						alignItems: 'center',
						gap: 0.75,
						px: 2.5,
						py: 1,
						borderRadius: '10px',
						cursor: 'pointer',
						transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
						bgcolor: tab === i ? 'primary.main' : 'transparent',
						boxShadow: tab === i ? '0 2px 8px rgba(0, 184, 148, 0.25)' : 'none',
						color: tab === i ? 'primary.contrastText' : 'text.secondary',
						userSelect: 'none',
						'&:hover': tab !== i
							? { bgcolor: 'rgba(255,255,255,0.08)', color: 'text.primary' }
							: {},
					}}
				>
					{t.icon}
					<Typography sx={{ fontWeight: tab === i ? 700 : 500, fontSize: '0.85rem', color: 'inherit', lineHeight: 1 }}>
						{t.label}
					</Typography>
				</Box>
			))}
		</Box>
	);

	return (
		<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', zoom: 0.8 }}>
			{/* Content */}
			<Box sx={{ flex: 1, overflow: 'auto' }}>
				{tab === 0 && <InboxPage tabsNode={tabsNode} />}
				{tab === 1 && <OutboxPage tabsNode={tabsNode} />}
				{tab === 2 && <GroupsPage tabsNode={tabsNode} />}
			</Box>
		</Box>
	);
}
