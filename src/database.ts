import { Azkar, Category, Zekr } from './models/azkar';
import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';

export class DatabaseManager {
    private db: sqlite3.Database;

    constructor(dbPath: string) {
        this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error('Error opening database:', err);
                throw err;
            }
        });
    }

    private async runQuery<T>(query: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows as T[]);
            });
        });
    }
    
    async getAzkar(): Promise<Azkar[]> {
        const query = `
            WITH RowsAsJson AS (
                SELECT 
                    json_object(
                        'zekr', zekr,  -- Keep as string for now
                        'description', COALESCE(azkar.description, ''),
                        'count', COALESCE(azkar.count, 1),
                        'reference', COALESCE(azkar.reference, ''),
                        'search', COALESCE(azkar.search, '')
                    ) as row_data,
                    azkar.category,
                    c.search as category_search
                FROM azkar
                LEFT JOIN main.category c on c.category = azkar.category
            )
            SELECT 
                json_object(
                    'category', json_object(
                        'name', category,
                        'search', category_search
                    ),
                    'zikr', json_group_array(row_data)
                ) as result
            FROM RowsAsJson
            GROUP BY category;
        `;

        try {
            interface QueryRow {
                result: string;
            }

            const rows = await this.runQuery<QueryRow>(query);

            return rows.map(row => {
                const parsed = JSON.parse(row.result);

                return {
                    category: parsed.category,
                    zikr: parsed.zikr.map((item: string) => {
                        // Parse the string item first
                        const zekrObj = JSON.parse(item);
                        return {
                            zekr: zekrObj.zekr,
                            description: zekrObj.description,
                            count: zekrObj.count,
                            reference: zekrObj.reference,
                            search: zekrObj.search
                        };
                    })
                };
            });
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }


    // Add method to close the database connection
    async close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
}