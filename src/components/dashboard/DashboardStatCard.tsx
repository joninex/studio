// src/components/dashboard/DashboardStatCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from 'lucide-react';
import { cn } from "@/lib/utils";

interface DashboardStatCardProps {
    title: string;
    value: string | number;
    description: string;
    icon: LucideIcon;
    isWarning?: boolean;
}

export function DashboardStatCard({ title, value, description, icon: Icon, isWarning = false }: DashboardStatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={cn("h-4 w-4 text-muted-foreground", isWarning && "text-destructive")} />
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", isWarning && "text-destructive")}>{value}</div>
                <p className="text-xs text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    );
}
