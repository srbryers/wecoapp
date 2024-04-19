import { atom } from "jotai";
import { ModalProps } from "./types";

export const modalAtom = atom<ModalProps | null>(null);