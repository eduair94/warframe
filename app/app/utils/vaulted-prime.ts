/** Relic vaulting is not evidence that a Prime item is vaulted.
 * Require an explicit item status and the canonical English Prime name;
 * analytics may omit tags, and `Primed` mods are not Prime equipment.
 */
export function isVaultedPrime(item: { item_name?: string; vaulted?: boolean } | null | undefined): boolean {
  return item?.vaulted === true && /\bPrime\b/i.test(item.item_name ?? '')
}
