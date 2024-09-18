"use client"

import useStore from '@/lib/tbdex';
import React, { useEffect } from 'react'

const HeaderBox = ({type="title", title, subtext}: HeaderBoxProps) => {
  const { user, fetchLoggedInUser, setExistingDID, fetchOfferings, initializeDid, loadCredentials, pollExchanges } = useStore();

  useEffect(() => {
    fetchLoggedInUser(); // Fetch the logged-in user when the component mounts
    console.log('Fetching offerings...');
    fetchOfferings();
    console.log('set Existing DID...');
    setExistingDID();
    console.log('Loading credentials...');
    loadCredentials();
    console.log('Polling exchanges');
    pollExchanges();
  }, [fetchLoggedInUser]);
  return (
    <div className="header-box">
        <h1 className='header-box-title'>
            {title}
            {type === 'greeting' && (
                <span className="text-bankGradient">
                    &nbsp;{user?.firstName}
                </span>
            )}
        </h1>
        <p className="header-box-subtext">{subtext}</p>
    </div>
  )
}

export default HeaderBox