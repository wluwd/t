// @info this file does what `publishConfig` does, but it's automated and allows us to keep the package files clean
import { access, constants, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pathToPackages = resolve(__dirname, "../packages");

const packages = await readdir(pathToPackages);

/**
 * @param {string} filename
 * @param {string} newExtname
 */
const changeFileExtname = (filename, newExtname) =>
	`${basename(filename, extname(filename))}${
		newExtname.startsWith(".") ? newExtname : `.${newExtname}`
	}`;

await Promise.all(
	packages.map(async (packageName) => {
		const pathToPackage = resolve(pathToPackages, packageName);
		const pathToPackageFile = resolve(pathToPackage, "package.json");
		const pathToDist = resolve(pathToPackage, "dist");

		/** @type {import("type-fest").PackageJson} */
		// eslint-disable-next-line ts/no-unsafe-assignment
		const packageConfig = structuredClone(
			await import(pathToPackageFile, {
				assert: {
					type: "json",
				},
			}).then(
				(exports) =>
					// eslint-disable-next-line ts/no-unsafe-return, ts/no-unsafe-member-access
					exports.default,
			),
		);

		await Promise.all(
			Object.entries(packageConfig.exports).map(
				async ([exportPath, exportTypes]) => {
					if (typeof exportTypes !== "object") {
						return;
					}

					await Promise.all(
						Object.entries(exportTypes).map(async ([exportType, filepath]) => {
							const newPath = `./${relative(
								pathToPackage,
								resolve(
									pathToDist,
									changeFileExtname(
										filepath,
										exportType === "types" ? ".d.ts" : ".js",
									),
								),
							)}`;

							await access(resolve(pathToPackage, newPath), constants.R_OK);

							// eslint-disable-next-line ts/no-unsafe-member-access
							packageConfig.exports[exportPath][exportType] = newPath;
						}),
					);
				},
			),
		);

		packageConfig.files = ["dist"];

		await writeFile(pathToPackageFile, JSON.stringify(packageConfig, null, 2));
	}),
);
