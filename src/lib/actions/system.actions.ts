// src/lib/actions/system.actions.ts
"use server";

import { promises as fs } from 'fs';
import path from 'path';
import type { FullBackupData } from '@/types';

// Import all raw data getters and restorers
import { getRawUserData, restoreUserData } from './user.actions';
import { getRawClientData, restoreClientData } from './client.actions';
import { getRawOrderData, restoreOrderData } from './order.actions';
import { getRawPartData, restorePartData } from './part.actions';
import { getRawSupplierData, restoreSupplierData } from './supplier.actions';
import { getRawBranchData, restoreBranchData } from './branch.actions';
import { getRawNotificationData, restoreNotificationData } from './notification.actions';

const BACKUP_FILE_NAME = 'gori_backup.json';
const backupFilePath = path.join(process.cwd(), BACKUP_FILE_NAME);

export async function checkBackupExists(): Promise<boolean> {
    try {
        await fs.access(backupFilePath);
        return true;
    } catch {
        return false;
    }
}

export async function createBackup(): Promise<{ success: boolean; message: string }> {
    try {
        const backupData: FullBackupData = {
            usersData: await getRawUserData(),
            clientsData: await getRawClientData(),
            ordersData: await getRawOrderData(),
            partsData: await getRawPartData(),
            suppliersData: await getRawSupplierData(),
            branchesData: await getRawBranchData(),
            notificationsData: await getRawNotificationData(),
            backupDate: new Date().toISOString(),
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        await fs.writeFile(backupFilePath, jsonString, 'utf-8');

        return { success: true, message: 'Backup creado exitosamente en `gori_backup.json`.' };
    } catch (error) {
        console.error("Error al crear el backup:", error);
        return { success: false, message: 'No se pudo crear el archivo de backup.' };
    }
}


export async function restoreBackup(): Promise<{ success: boolean; message: string }> {
    try {
        if (!(await checkBackupExists())) {
            return { success: false, message: 'No se encontró el archivo de backup.' };
        }

        const jsonString = await fs.readFile(backupFilePath, 'utf-8');
        const backupData: FullBackupData = JSON.parse(jsonString);

        // Restore all data modules
        await restoreUserData(backupData.usersData);
        await restoreClientData(backupData.clientsData);
        await restoreOrderData(backupData.ordersData);
        await restorePartData(backupData.partsData);
        await restoreSupplierData(backupData.suppliersData);
        await restoreBranchData(backupData.branchesData);
        await restoreNotificationData(backupData.notificationsData);

        return { success: true, message: 'Datos restaurados exitosamente. La aplicación se recargará.' };
    } catch (error: any) {
        console.error("Error al restaurar el backup:", error);
        return { success: false, message: `No se pudo restaurar el backup. Error: ${error.message}` };
    }
}
