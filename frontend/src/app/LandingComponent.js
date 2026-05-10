"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LandingComponent() {
    const router = useRouter();

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
                onClick={() => router.push('/race')}
            >
                Enter
            </button>
        </section>
    )
}
