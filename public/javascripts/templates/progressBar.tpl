<tr>
  <td class="px-6 py-4 whitespace-nowrap">
    <div class="flex items-center">
      <div class="flex-shrink-0 h-10 w-10">
        <img
          class="h-10 w-10 rounded-full"
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=4&w=256&h=256&q=60"
          alt=""
        />
      </div>
      <div class="ml-4">
        <div class="text-sm font-medium text-gray-900">{{ name }}</div>
      </div>
    </div>
  </td>
  <td class="px-6 py-4 whitespace-nowrap">
    <div class="relative pt-1">
      <div class="flex mb-2 items-center justify-between">
        <div class="overflow-hidden h-2 text-xs flex-grow rounded bg-emerald-200">
          <div
                  style="width: 0;"
                  class="shadow-none h-full flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"
                  id="progressBar{{id}}"
          ></div>
        </div>
        <div class="text-right ml-1">
          <span id="percent{{id}}" class="text-xs font-semibold inline-block text-emerald-600">0%</span>
        </div>
      </div>
    </div>
  </td>
  <td class="px-6 py-4 whitespace-nowrap">
    <div class="relative pt-1">
      <div class="flex mb-2 items-center justify-end">
        <span id="flag{{id}}" class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-200">
          task in progress
        </span>
      </div>
    </div>
  </td>
  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
    <a id="cancel{{id}}" href="javascript: void(0);" class="ml-2 text-indigo-600 hover:text-indigo-900">Cancel</a>
  </td>
</tr>
