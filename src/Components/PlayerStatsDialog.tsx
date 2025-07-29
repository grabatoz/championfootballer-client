import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { Box, IconButton, Typography } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import Goals from '@/Components/images/goal.png'
import Imapct from '@/Components/images/imapct.png'
import Assist from '@/Components/images/Assist.png'
import Defence from '@/Components/images/defence.png'
import CleanSheet from '@/Components/images/cleansheet.png'
import FreeKick from '@/Components/images/freekick.png'
import penalty from '@/Components/images/penalty.png'

// You may need to import your StatCounter and stat icons here
// import StatCounter from './StatCounter';
// import Goals from '@/Components/images/goal.png';
// import Assist from '@/Components/images/Assist.png';
// import CleanSheet from '@/Components/images/cleansheet.png';
// import penalty from '@/Components/images/penalty.png';
// import FreeKick from '@/Components/images/freekick.png';
// import Defence from '@/Components/images/defence.png';
// import Imapct from '@/Components/images/imapct.png';

interface PlayerStatsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  isSubmitting: boolean;
  stats: {
    goals: number;
    assists: number;
    cleanSheets: number;
    penalties: number;
    freeKicks: number;
    defence: number;
    impact: number;
  };
  handleStatChange: (stat: "goals" | "assists" | "cleanSheets" | "penalties" | "freeKicks" | "defence" | "impact", increment: number, max: number) => void;
  teamGoals?: number;
}

const PlayerStatsDialog: React.FC<PlayerStatsDialogProps> = ({
  open,
  onClose,
  onSave,
  isSubmitting,
  stats,
  handleStatChange,
  teamGoals = 10, // Default value
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Your Stats for the Match</DialogTitle>
      <DialogContent>
                    <StatCounter icon={<img src={Goals.src} alt="Goals Scored" style={{ width: 24, height: 24 }} />} label="Goals Scored" value={stats.goals} onIncrement={() => handleStatChange('goals', 1, teamGoals)} onDecrement={() => handleStatChange('goals', -1, teamGoals)} />
                    <StatCounter icon={<img src={Assist.src} alt="Assists" style={{ width: 24, height: 24 }} />} label="Assists" value={stats.assists} onIncrement={() => handleStatChange('assists', 1, teamGoals)} onDecrement={() => handleStatChange('assists', -1, teamGoals)} />
                    <StatCounter icon={<img src={CleanSheet.src} alt="Clean Sheets" style={{ width: 24, height: 24 }} />} label="Clean Sheets" value={stats.cleanSheets} onIncrement={() => handleStatChange('cleanSheets', 1, 1)} onDecrement={() => handleStatChange('cleanSheets', -1, 1)} />
                    <StatCounter icon={<img src={penalty.src} alt='penalty' style={{ width: 24, height: 24 }} />} label="Penalties" value={stats.penalties} onIncrement={() => handleStatChange('penalties', 1, teamGoals)} onDecrement={() => handleStatChange('penalties', -1, teamGoals)} />
                    <StatCounter icon={<img src={FreeKick.src} alt='freekick' style={{ width: 24, height: 24 }} />} label="Free Kicks" value={stats.freeKicks} onIncrement={() => handleStatChange('freeKicks', 1, teamGoals)} onDecrement={() => handleStatChange('freeKicks', -1, teamGoals)} />
                    <StatCounter icon={<img src={Defence.src} alt="Defence" style={{ width: 24, height: 24 }} />} label="Defence" value={stats.defence} onIncrement={() => handleStatChange('defence', 1, 1)} onDecrement={() => handleStatChange('defence', -1, 1)} />
                    <StatCounter icon={<img src={Imapct.src} alt="Impact" style={{ width: 24, height: 24 }} />} label="Impact" value={stats.impact} onIncrement={() => handleStatChange('impact', 1, 1)} onDecrement={() => handleStatChange('impact', -1, 1)} />
                </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} variant="contained" disabled={isSubmitting}>{isSubmitting ? <CircularProgress size={24} /> : 'Upload'}</Button>
      </DialogActions>
    </Dialog>
  );
};

const StatCounter = ({ label, value, onIncrement, onDecrement, icon }: { label: string, value: number, onIncrement: () => void, onDecrement: () => void, icon: React.ReactNode }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 2, p: 1, borderRadius: 2, background: 'rgba(0,0,0,0.05)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            {icon}
            <Typography sx={{ ml: 2, fontWeight: 500 }}>{label}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={onDecrement} size="small"><Remove /></IconButton>
            <Typography sx={{ mx: 2, fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{value}</Typography>
            <IconButton onClick={onIncrement} size="small"><Add /></IconButton>
        </Box>
    </Box>
); 

export default PlayerStatsDialog; 