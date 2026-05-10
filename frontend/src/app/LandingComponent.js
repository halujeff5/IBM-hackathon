"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LandingComponent() {
    const router = useRouter();

    const handleEnter = () => {
        // Set countdown to 3 minutes (180 seconds) when entering from home screen
        if (typeof window !== 'undefined') {
            localStorage.setItem('countdown', '180');
            localStorage.setItem('countdownTimestamp', String(Date.now()));
        }
        router.push('/race');
    };

    return (
        <section className="landing-hero">
            <h1 className="landing-title">F1 Racing Sports Betting</h1>
            <Image
                className="landing-image"
                src="/f1-racing.jpg"
                alt="F1 racing"
                width={1600}
                height={900}
                priority
            />
            <button
                className="enter-button"
                type="button"
                onClick={handleEnter}
            >
                Enter
            </button>
        </section>
    )
}
