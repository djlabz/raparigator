import { describe, expect, it } from "vitest";
import type { AnnouncementMediaHistoryMap } from "@sigillus/contracts";
import {
  getCurrentMediaOffset,
  getMediaHistoryChain,
  hasOperationInHistory,
  planMediaUndo,
  translateAreaFromSource,
  translateAreaToSource,
} from "../src/media-history";

const history: AnnouncementMediaHistoryMap = {
  "blob:crop-1": {
    parent: "https://cdn/original.jpg",
    operation: "edit",
    cropArea: { x: 100, y: 50, width: 800, height: 600 },
  },
  "blob:blur-1": {
    parent: "blob:crop-1",
    operation: "blur",
    blurMode: "crop",
    cropArea: { x: 150, y: 80, width: 200, height: 100 },
  },
  "blob:crop-2": {
    parent: "blob:blur-1",
    operation: "edit",
    cropArea: { x: 140, y: 70, width: 400, height: 300 },
  },
};

describe("media-history", () => {
  it("monta a cadeia da origem até a versão atual", () => {
    expect(getMediaHistoryChain("blob:crop-2", history).map((item) => item.src)).toEqual([
      "blob:crop-1",
      "blob:blur-1",
      "blob:crop-2",
    ]);
    expect(getMediaHistoryChain("blob:blur-1", history).map((item) => item.src)).toEqual([
      "blob:crop-1",
      "blob:blur-1",
    ]);
  });

  it("imagem sem histórico tem cadeia vazia", () => {
    expect(getMediaHistoryChain("https://cdn/original.jpg", history)).toEqual([]);
    expect(getMediaHistoryChain("blob:crop-1", {})).toEqual([]);
  });

  it("diz se a operação aparece na cadeia da imagem atual", () => {
    expect(hasOperationInHistory("blob:crop-2", history, "blur")).toBe(true);
    expect(hasOperationInHistory("blob:crop-1", history, "edit")).toBe(true);
    expect(hasOperationInHistory("blob:crop-1", history, "blur")).toBe(false);
    expect(hasOperationInHistory("https://cdn/original.jpg", history, "edit")).toBe(false);
  });

  it("o deslocamento atual é o do recorte mais recente da cadeia", () => {
    expect(getCurrentMediaOffset("blob:crop-2", history)).toEqual({ x: 140, y: 70 });
    expect(getCurrentMediaOffset("blob:blur-1", history)).toEqual({ x: 100, y: 50 });
  });

  it("sem recorte na cadeia o deslocamento é zero", () => {
    expect(getCurrentMediaOffset("https://cdn/original.jpg", history)).toEqual({ x: 0, y: 0 });
    expect(
      getCurrentMediaOffset("blob:so-blur", {
        "blob:so-blur": {
          parent: "https://cdn/original.jpg",
          operation: "blur",
          blurMode: "brush",
        },
      }),
    ).toEqual({ x: 0, y: 0 });
  });

  it("converte a área entre a imagem original e a imagem recortada", () => {
    const area = { x: 150, y: 80, width: 200, height: 100 };
    const offset = { x: 100, y: 50 };
    expect(translateAreaToSource(area, offset)).toEqual({ x: 50, y: 30, width: 200, height: 100 });
    expect(translateAreaFromSource({ x: 50, y: 30, width: 200, height: 100 }, offset)).toEqual(
      area,
    );
  });

  it("desfazer remove a última ocorrência da operação e mantém as demais em ordem", () => {
    const plan = planMediaUndo("blob:crop-2", history, "edit");
    expect(plan?.baseSrc).toBe("https://cdn/original.jpg");
    expect(plan?.remaining.map((item) => item.src)).toEqual(["blob:crop-1", "blob:blur-1"]);

    const blurPlan = planMediaUndo("blob:crop-2", history, "blur");
    expect(blurPlan?.baseSrc).toBe("https://cdn/original.jpg");
    expect(blurPlan?.remaining.map((item) => item.src)).toEqual(["blob:crop-1", "blob:crop-2"]);
  });

  it("desfazer operação que não está na cadeia não tem plano", () => {
    expect(planMediaUndo("blob:crop-1", history, "blur")).toBeNull();
    expect(planMediaUndo("https://cdn/original.jpg", history, "edit")).toBeNull();
  });
});
