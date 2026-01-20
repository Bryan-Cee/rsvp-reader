"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Button from "components/ui/Button";
import Icon from "components/AppIcon";

const NotFound = () => {
  const router = useRouter();

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <h1 className="text-9xl font-bold text-primary opacity-20">404</h1>
          </div>
        </div>

        <h2 className="text-2xl font-medium text-onBackground mb-2">
          Page Not Found
        </h2>
        <p className="text-onBackground/70 mb-8">
          The page you&rsquo;re looking for doesn&rsquo;t exist. Let&rsquo;s get
          you back!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="primary"
            icon={<Icon name="ArrowLeft" />}
            iconPosition="left"
            onClick={() => window.history?.back()}
          >
            Go Back
          </Button>

          <Button
            variant="outline"
            icon={<Icon name="Home" />}
            iconPosition="left"
            onClick={handleGoHome}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
