import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../../ui/card";

export function DisabledCard({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title} (Disabled)</CardTitle>
        <CardDescription>
          {description ??
            "This section has been disabled by the administrator."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description ??
            "This functionality is not available in this deployment. Contact your administrator if you need access."}
        </p>
      </CardContent>
    </Card>
  );
}

export default DisabledCard;
