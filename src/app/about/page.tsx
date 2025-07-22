"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function AboutCF() {
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [])

  return (
    <div className='p-6'>
      <div className="mb-5 text-3xl font-semibold">About CF</div>
      <div className="flex flex-col gap-2">
        <p>
          {`CF helps organise and records your football matches including number of games won, lost and goals scored when
          playing football matches with your friends. It's a free service which allows you to connect your passion for
          football with other football enthusiast.`}
        </p>
        <p>
         {` CF can be used for all occasions, whether playing a 5 or 7 aside football matches on an artificial pitch,
          weekend kick around at the park or playing in your local "cage" to showcase your lethal ball skills. Why not
          make it rewarding and competitive!`}
        </p>
        <p>
         {` CF platform provides user friendly features to easily arrange football matches with your friends. Including;
          adding date/time, location of match and picking teams from a real-time player availability list.`}
        </p>
        <p>
        {`  On CF you can have fun in setting up your player card, arrange a series of matches, mix up the teams every
          time you play and see who comes up on top with the greatest number of wins!`}
        </p>
        <p>
          {`After each match is played, you can go ahead and rate your best player on the pitch and win virtual awards.`}
        </p>
        <p>
{`          CF can help you have fun playing the world's most loved sport, providing you with a unique experience that
          connects football fans all around the world. It's a fun way to bring social media experience and playing
          football together!`}
        </p>
        <p className="font-bold">{`Become Champion Footballer!`}</p>
        <p>
         {` CF is for everyone at all playing levels, who would like to relish the chance to become their local champion!`}{" "}
          <Link href="/" className="font-bold text-blue-500 hover:text-blue-700 hover:underline">
            Sign-up
          </Link>{" "}
         {` now to join an existing league or create a new league/group and invite your friends to play.`}
        </p>
      </div>
    </div>
  )
}
