"use client"
import { Card, Typography, Box } from "@mui/material"
import { styled } from "@mui/material/styles"
import Link from "next/link"
import Image from "next/image"
import Group from '@/Components/images/group451.png'









const CardContentBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: 20,
  padding: '20px 28px',
  [theme.breakpoints.down('sm')]: {
    padding: '14px 10px',
    gap: 10,
  },
}))

const ModernCard = styled(Card)(({}) => ({
  background: '#1f673b',
  borderRadius: 20,
  boxShadow: '0 4px 24px 0 rgba(34,139,34,0.13)',
  border: '2px solid #43a047',
  transition: 'box-shadow 0.18s, border 0.18s',
  '&:hover': {
    boxShadow: '0 8px 32px 0 #43ff7a33',
    borderColor: '#43ff7a',
  },
  minHeight: 110,
  display: 'flex',
  alignItems: 'center',
}))


const ModernName = styled(Typography)(({ theme }) => ({
  color: '#fff',
  fontWeight: 700,
  fontSize: 22,
  lineHeight: 1.1,
  [theme.breakpoints.down('sm')]: {
    fontSize: 16,
  },
}))

const ModernPosition = styled(Typography)(({ theme }) => ({
  color: '#43ff7a',
  fontWeight: 500,
  fontSize: 15,
  marginTop: 2,
  marginBottom: 2,
  [theme.breakpoints.down('sm')]: {
    fontSize: 13,
  },
}))

const ModernShirt = styled(Box)(({ theme }) => ({
  display: 'inline-block',
  background: 'linear-gradient(90deg, #43ff7a 0%, #1f673b 100%)',
  color: '#fff',
  fontWeight: 600,
  fontSize: 14,
  borderRadius: 999,
  padding: '3px 14px',
  marginTop: 4,
  [theme.breakpoints.down('sm')]: {
    fontSize: 12,
    padding: '2px 8px',
  },
}))

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
  return (
    <Link href={`/player/${member.id}`} style={{ textDecoration: 'none' }}>
      <ModernCard>
        <CardContentBox>
          {/* <ModernProfile> */}
            {member.profilePicture ? (
              <Image
                src={member.profilePicture}
                alt="Profile"
                width={64}
                height={64}
                style={{ objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              <Image
              src={Group}
              alt="Profile"
              width={60}
              height={60}
              style={{ objectFit: 'cover', borderRadius: '50%' }}
            />
            )}
          {/* </ModernProfile> */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
            <ModernName variant="h6" noWrap>
              {member.firstName} {member.lastName}
            </ModernName>
            <ModernPosition variant="subtitle2" noWrap>
              {member.position || 'Position/Type'}
            </ModernPosition>
            <ModernShirt>
              Shirt No {member.shirtNumber || 'N/A'}
            </ModernShirt>
          </Box>
        </CardContentBox>
      </ModernCard>
    </Link>
  )
}
