'use client';

import React, { useState } from 'react';
import Blog from '@/components/blog';
import CMS from '@/components/cms';

export default function Home() {
  const [cmsActive, setCmsActive] = useState(false);

  return (
    <>
      {cmsActive ? (
        <CMS onExitCMS={() => setCmsActive(false)} />
      ) : (
        <Blog onEnterCMS={() => setCmsActive(true)} />
      )}
    </>
  );
}
