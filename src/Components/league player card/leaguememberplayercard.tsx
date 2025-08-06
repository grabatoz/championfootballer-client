"use client"
import { Card, Typography, Box, ListItem, ListItemAvatar, Avatar, ListItemText, Divider } from "@mui/material"
import { styled } from "@mui/material/styles"
import Link from "next/link"

// import Group from '@/Components/images/group451.png'
// import Image from "next/image"
import React from "react"
import { useRouter } from "next/navigation"









// const CardContentBox = styled(Box)(({ theme }) => ({
//   display: 'flex',
//   flexDirection: 'row',
//   alignItems: 'center',
//   gap: 20,
//   padding: '20px 28px',
//   [theme.breakpoints.down('sm')]: {
//     padding: '14px 10px',
//     gap: 10,
//   },
// }))

// const ModernCard = styled(Card)(({}) => ({
//   background: '#1f673b',
//   borderRadius: 20,
//   boxShadow: '0 4px 24px 0 rgba(34,139,34,0.13)',
//   border: '2px solid #43a047',
//   transition: 'box-shadow 0.18s, border 0.18s',
//   '&:hover': {
//     boxShadow: '0 8px 32px 0 #43ff7a33',
//     borderColor: '#43ff7a',
//   },
//   minHeight: 110,
//   display: 'flex',
//   alignItems: 'center',
// }))


// const ModernName = styled(Typography)(({ theme }) => ({
//   color: '#fff',
//   fontWeight: 700,
//   fontSize: 22,
//   lineHeight: 1.1,
//   [theme.breakpoints.down('sm')]: {
//     fontSize: 16,
//   },
// }))

// const ModernPosition = styled(Typography)(({ theme }) => ({
//   color: '#43ff7a',
//   fontWeight: 500,
//   fontSize: 15,
//   marginTop: 2,
//   marginBottom: 2,
//   [theme.breakpoints.down('sm')]: {
//     fontSize: 13,
//   },
// }))

// const ModernShirt = styled(Box)(({ theme }) => ({
//   display: 'inline-block',
//   background: 'linear-gradient(90deg, #43ff7a 0%, #1f673b 100%)',
//   color: '#fff',
//   fontWeight: 600,
//   fontSize: 14,
//   borderRadius: 999,
//   padding: '3px 14px',
//   marginTop: 4,
//   [theme.breakpoints.down('sm')]: {
//     fontSize: 12,
//     padding: '2px 8px',
//   },
// }))

interface PlayerCardProps {
  member: {
    id: string
    firstName: string
    lastName: string
    profilePicture?: string
    position?: string
    shirtNumber?: number
  }
}

export default function PlayerCard({ member }: PlayerCardProps) {
  const router = useRouter();
  return (
    <Link href={`/player/${member.id}`} style={{ textDecoration: 'none' }}>
    <React.Fragment key={member.id}>
                    <ListItem
                      onClick={() => {
                        // setSelectedPlayerId(player.id);
                        router.push(`/player/${member.id}`);
                      }}
                      sx={{
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        // background: rowGradient ? rowGradient : rowBg,
                        // color: textColor,
                        // fontWeight,
                        cursor: 'pointer',
                        py: { xs: 1, sm: 2 },
                        px: { xs: 1, sm: 2 },
                        alignItems: 'center',
                      }}
                    >
                      {/* Ranking badge or number */}
                      {/* <Box sx={{ width: { xs: 28, sm: 36 }, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: { xs: 1, sm: 2 } }}>
                        {badgeImg ? (
                          <img src={badgeImg.src} alt={`${idx + 1}st`} width={24} height={24} style={{ borderRadius: '50%' }} />
                        ) : (
                          <Box sx={{
                            width: 20, height: 20, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 10,
                            borderRadius: '50%', background: 'rgba(255,255,255,0.15)'
                          }}>{`${idx + 1}th`}</Box>
                        )}
                      </Box> */}
                      <ListItemAvatar>
                        <Avatar src={member?.profilePicture || '/assets/group.svg'} sx={{ width: { xs: 28, sm: 40 }, height: { xs: 28, sm: 40 } }} />
                      </ListItemAvatar>
                      <ListItemText primary={member.firstName + ' ' + member.lastName} primaryTypographyProps={{ fontWeight: 'medium', fontSize: { xs: 13, sm: 16 } }} />
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, sm: 8 }, ml: 'auto' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: { xs: 24, sm: 40 } }}>
                          {/* <SignalCellularAltIcon sx={{ color: isSelected ? 'white' : '#00C853', fontSize: { xs: 16, sm: 24 } }} /> */}
                        </Box>
                        <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', minWidth: { xs: 36, sm: 60 }, textAlign: 'center', fontSize: { xs: 13, sm: 20 } }}>
                          {member.position}
                        </Typography>
                      </Box>
                    </ListItem>
                    <Divider sx={{ backgroundColor: '#fff', height: 1, mb: 0, mt: 0 }} />
                  </React.Fragment>
    </Link>
  )
}

      // <ModernCard>
      //   <CardContentBox>
      //     {/* <ModernProfile> */}
      //       {member.profilePicture ? (
      //         <img
      //           src={member.profilePicture}
      //           alt="Profile"
      //           width={64}
      //           height={64}
      //           style={{ objectFit: 'cover', borderRadius: '50%' , height: '70px' , width: '70px' }}
      //         />
      //       ) : (
      //         <Image
      //         src={Group}
      //         alt="Profile"
      //         width={60}
      //         height={60}
      //         style={{ objectFit: 'cover', borderRadius: '50%' }}
      //       />
      //       )}
      //     {/* </ModernProfile> */}
      //     <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
      //       <ModernName variant="h6" noWrap>
      //         {member.firstName} {member.lastName}
      //       </ModernName>
      //       <ModernPosition variant="subtitle2" noWrap>
      //         {member.position || 'Position/Type'}
      //       </ModernPosition>
      //       <ModernShirt>
      //         Shirt No {member.shirtNumber || 'N/A'}
      //       </ModernShirt>
      //     </Box>
      //   </CardContentBox>
      // </ModernCard>