import React from 'react'
import PlayerProfileCard from './_components'
import AuthCheck from '@/Components/AuthCheck';

function Page() {
  return (
    <>
      <AuthCheck />
      <PlayerProfileCard/>
    </>
  )
}

export default Page