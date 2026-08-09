import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";

export async function persistProjectSpec(
  projectId: string,
  markdown: string,
): Promise<string> {
  const specRecord = await prisma.projectSpec.create({
    data: {
      projectId,
      filePath: "pending",
    },
  });

  const blob = await put(`specs/${projectId}/${specRecord.id}.md`, markdown, {
    access: "private",
    contentType: "text/markdown",
  });

  await prisma.projectSpec.update({
    where: { id: specRecord.id },
    data: { filePath: blob.url },
  });

  return specRecord.id;
}
